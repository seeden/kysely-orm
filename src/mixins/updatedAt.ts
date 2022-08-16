import { sql, type Updateable, type InsertObject } from 'kysely';
import { type Model } from './model';
import type Constructor from '../@types/Constructor';

export default function updatedAt<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>( field: keyof DB[TableName] & string) {
  return <TBase extends Model<Constructor, DB, TableName, IdColumnName>>(Base: TBase) => {
    return class UpdatedAt extends Base {
      static async beforeUpdate(data: Updateable<InsertObject<DB, TableName>>) {
  
        return {
          ...await Base.beforeUpdate(data),
          [field]: sql`NOW()`,
        };
      }

      static omgggggg() {
        return 'omgggggg';
      }

      get updatedAtMeMber() {
        return 'updatedAtMeMber';
      }
    }
  }
}

