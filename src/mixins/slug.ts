import { sql, SqliteAdapter, type Insertable } from 'kysely';
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

type Options<DB, TableName extends keyof DB> = {
  field: keyof DB[TableName] & string;
  sources: (keyof DB[TableName] & string)[];
  operation?: Operation;
  slugOptions?: {
    separator?: string;
    truncate?: number;
    dictionary?: { [key:string]: string };
  };
};

function generate<DB, TableName extends keyof DB>(data: Data, options: Options<DB, TableName>): string | undefined {
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
>(
  Base: TBase,
  options: Options<DB, TableName>,
) {
  type Table = DB[TableName];
  return class Slug extends Base {
    static async beforeInsert(data: Insertable<Table>) {
      const { field } = options;

      return {
        ...await Base.beforeInsert(data),
        [field]: await this.generateSlug(data),
      };
    }

    static async findBySlug(value: string, column: keyof Table & string = options.field) {
      return this
        .selectFrom()
        .selectAll()
        .where(this.ref(column), '=', value)
        .limit(1)
        .executeTakeFirst();
    }

    static async generateSlug(data: Insertable<Table>): Promise<string> {
      const { field } = options;
    
      // generate slug
      const slug = generate(data, options) ?? puid.generate();
    
      // check if slug is already taken
      const rowWithSlug = await this.findBySlug(slug, field);
      if (!rowWithSlug) {
        return slug;
      }

      const operator = this.db.isSqlite ? 'like' : '~';

      // TODO add lock by bigint (hashed slug)
    
      // generate new slug
      const firstRow = await this
        .selectFrom()
        .where(this.ref(field), operator, `^${slug}[0-9]*$`)
        .orderBy(sql`length(${sql.ref(field)})`, 'desc')
        .orderBy(this.ref(field), 'desc')
        .select(this.ref(field))
        .limit(1)
        .executeTakeFirst();
    
      if (firstRow) {
        const lastSlug = firstRow[field] as unknown as string;
        const number = lastSlug?.substr(slug.length);
        const nextNumber = number ? Number(number) + 1 : 2;
        return `${slug}${nextNumber}`;
      }
    
      return `${slug}2`;
    }
  }
}
