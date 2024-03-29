import { sql, type Insertable } from 'kysely';
import urlSlug from 'url-slug';
// @ts-ignore
import Puid from 'puid';
import { type Model } from './model';

const puid = new Puid(true);

type Data = { [key:string]: any };

export enum Operation {
  GRAB_FIRST,
  CONCAT,
}

type SlugOptions = {
  separator?: string;
  truncate?: number;
  dictionary?: { [key: string]: string };
};

type Options<DB, TableName extends keyof DB> = {
  field: keyof Insertable<DB[TableName]> & string;
  sources: (keyof DB[TableName] & string)[];
  operation?: Operation;
  slugOptions?: SlugOptions;
};

function generateSlugValue<DB, TableName extends keyof DB>(data: Data, options: Options<DB, TableName>): string | undefined {
  const { 
    sources, 
    operation = Operation.GRAB_FIRST,
    slugOptions: {
      separator = '-',
      truncate = 50,
      dictionary = {},
    } = {},
  } = options;

  let slug;

  if (operation === Operation.GRAB_FIRST) {
    for (let i = 0; i < sources.length; i += 1) {
      const value = data[sources[i]];
      const slugValue = value?.toString()?.trim();
      if (!!slugValue) {
        slug = value;
        break;
      }
    }
  } else if (operation === Operation.CONCAT) {
    const list: string[] = [];
    sources.forEach((source) => {
      const value = data[source];
      const slugValue = value?.toString()?.trim();
      if (!!slugValue) {
        list.push(slugValue);
      }
    });

    if (list.length) {
      slug = list.join(separator);
    }
  }

  if (slug) {
    const generatedSlug = urlSlug(slug, {
      separator,
      dictionary,
    });

    if (truncate && generatedSlug.length > truncate) {
      return generatedSlug.substring(0, truncate);
    }

    return generatedSlug;
  }

  return slug;
}


export default function slug<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<DB, TableName, IdColumnName>,
>(Base: TBase) {
  return <TOptions extends Options<DB, TableName>>(options: TOptions) => {
    const { field } = options;

    type Table = DB[TableName];
    type TableWithoutSlug = Omit<Table, TOptions['field']>;

    function hasValidSlugField(field: keyof Insertable<Table> & string, values: Insertable<Table> | Insertable<TableWithoutSlug>): values is Insertable<Table> {
      return field in values && (values as Insertable<Table>)[field] !== undefined;
    }

    return class Slug extends Base {
      static async findBySlug(value: string, column: keyof Table & string = options.field) {
        return this
          .selectFrom()
          .selectAll()
          .where(this.ref(`${this.table}.${column}`), '=', value)
          .limit(1)
          .executeTakeFirst();
      }

      static async insertOneWithSlug(
        values: Insertable<Table> | Insertable<TableWithoutSlug>,
        error?: Parameters<typeof Base.insertOne>[1],
      ) {
        if (field in values && hasValidSlugField(field, values)) {
          return super.insertOne(values, error);
        }

        return super.insertOne({
          ...values,
          [field]: await this.generateSlug(values as Insertable<TableWithoutSlug>),
        } as Insertable<Table>, error);
      }

      static async insertOneIfNotExistsWithSlug(
        values: Insertable<Table> | Insertable<TableWithoutSlug>,
        sameColumn: Parameters<typeof Base.insertOneIfNotExists>[1],
        conflictColumns: Parameters<typeof Base.insertOneIfNotExists>[2],
        error?: Parameters<typeof Base.insertOneIfNotExists>[3],
      ) {
        if (field in values && hasValidSlugField(field, values)) {
          return super.insertOneIfNotExists(values, sameColumn, conflictColumns, error);
        }

        return super.insertOneIfNotExists({
          ...values,
          [field]: await this.generateSlug(values as Insertable<TableWithoutSlug>),
        } as Insertable<Table>, sameColumn, conflictColumns, error);
      }

      static async upsertOneWithSlug(
        values: Insertable<Table> | Insertable<TableWithoutSlug>,
        upsertValues: Parameters<typeof Base.upsertOne>[1],
        conflictColumns: Parameters<typeof Base.upsertOne>[2],
        error?: Parameters<typeof Base.upsertOne>[3],
      ) {
        if (field in values && hasValidSlugField(field, values)) {
          return super.upsertOne(values, upsertValues, conflictColumns, error);
        }

        return super.upsertOne({
          ...values,
          [field]: await this.generateSlug(values as Insertable<TableWithoutSlug>),
        } as Insertable<Table>, upsertValues, conflictColumns, error);
      }

      static async generateSlug(data: Insertable<TableWithoutSlug>): Promise<string> {
        const { field, slugOptions: { truncate = 50 } = {} } = options;
      
        // generate slug
        const slug = generateSlugValue(data, options) ?? puid.generate();
      
        // check if slug is already taken
        const rowWithSlug = await this.findBySlug(slug, field);
        if (!rowWithSlug) {
          return slug;
        }

        const operator = this.db.isSqlite ? 'like' : '~';

        // TODO add lock by bigint (hashed slug)

        const shorterSlug = slug.substring(0, Math.max(0, truncate - 5));
      
        // generate new slug
        const firstRow = await this
          .selectFrom()
          .where(this.ref(`${this.table}.${field}`), operator, `^${shorterSlug}[0-9]*$`)
          .orderBy(sql`length(${sql.ref(`${this.table}.${field}`)})`, 'desc')
          .orderBy(this.ref(`${this.table}.${field}`), 'desc')
          .select(this.ref(`${this.table}.${field}`))
          .limit(1)
          .executeTakeFirst();
      
        if (firstRow) {
          const lastSlug = firstRow[field] as unknown as string;
          const number = lastSlug?.substring(shorterSlug.length);
          try {
            const nextNumber = number ? Number.parseInt(number) + 1 : 2;
            if (isNaN(nextNumber)) {
              throw new Error(`Invalid number: ${number}`);
            }

            if (nextNumber.toString().length > 10) {
              throw new Error(`Number is too long: ${nextNumber}`);
            }
    
            return `${shorterSlug}${nextNumber}`;
          } catch (e) {
            return puid.generate();
          }
        }
      
        return `${shorterSlug}2`;
      }
    }
  }
}
