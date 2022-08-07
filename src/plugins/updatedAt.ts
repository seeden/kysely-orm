import { sql, type Updateable, type InsertObject } from 'kysely';
import type Model from '../model';

export default function updatedAt<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string
>(field: keyof DB[TableName] & string) {
  return (ModelClass: typeof Model<DB, TableName, IdColumnName>) => class extends ModelClass {
    async beforeUpdate(data: Updateable<InsertObject<DB, TableName>>) {
      return {
        ...await super.beforeUpdate(data),
        [field]: sql`NOW()`,
      };
    }
  };
}
