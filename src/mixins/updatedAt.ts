import { sql, type Updateable, type InsertObject } from 'kysely';
import { type Model } from './model';
import Constructor from '../@types/Constructor';

function updatedAt<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>(field: keyof DB[TableName] & string) {
  return <TBase extends Constructor>(Base: Model<TBase, DB, TableName, IdColumnName>) => {
    return class UpdatedAt extends Base  {
      static async beforeUpdate(data: Updateable<InsertObject<DB, TableName>>) {
  
        return {
          ...await Base.beforeUpdate(data),
          [field]: sql`NOW()`,
        };
      }
    }
  }
}

export default updatedAt;
