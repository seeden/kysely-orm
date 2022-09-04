import { sql, type Updateable, type InsertObject } from 'kysely';
import { type Model } from './model';
import Constructor from '../@types/Constructor';

export default function updatedAt<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string, TBase extends Constructor>(
  Base: Model<TBase, DB, TableName, IdColumnName>, 
  field: keyof DB[TableName] & string
) {
  return class UpdatedAt extends Base  {
    static async beforeUpdate(data: Updateable<InsertObject<DB, TableName>>) {

      return {
        ...await Base.beforeUpdate(data),
        [field]: sql`NOW()`,
      };
    }
  }
}
