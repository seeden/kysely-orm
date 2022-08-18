import { sql, type Insertable } from 'kysely';
// @ts-ignore
import getSlug from 'speakingurl';
// @ts-ignore
import Puid from 'puid';
import { type Model } from './model';
import type Constructor from '../@types/Constructor';

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
    custom?: {
      [key: string]: string;
    };
  };
};

function generate<DB, TableName extends keyof DB>(data: Data, options: Options<DB, TableName>): string | undefined {
  const { 
    sources, 
    operation = Operation.GRAB_FIRST,
    slugOptions: {
      separator = '-',
      truncate = 50,
      ...rest
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
    return getSlug(slug, {
      separator,
      truncate,
      ...rest,
    });
  }

  return slug;
}

export default function slug<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>(options: Options<DB, TableName>) {
  return <TBase extends Constructor>(Base: Model<TBase, DB, any, any>) => {
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
        const item = await this
          .selectFrom()
          .selectAll()
          .where(this.db.dynamic.ref(column), '=', value)
          .limit(1)
          .executeTakeFirst();

        return item && this.createInstance(item);
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
      
        const { ref } = this.db.dynamic;

        // TODO add lock by bigint (hashed slug)
      
        // generate new slug
        const firstRow = await this
          .selectFrom()
          .where(ref(field), '~', `^${slug}[0-9]*$`)
          .orderBy(sql`length(${sql.ref(field)})`, 'desc')
          .orderBy(ref(field), 'desc')
          .select(ref(field))
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
  };
}
