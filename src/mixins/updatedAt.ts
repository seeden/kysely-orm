import { sql, type Updateable, type InsertObject } from 'kysely';
import { type Model } from './model';

export default function updatedAt<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>(
  Base: Model<DB, TableName, IdColumnName>, 
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
