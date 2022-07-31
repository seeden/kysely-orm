import { sql, type Updateable, type InsertObject } from 'kysely';
import type Model from '../model';

export default function updatedAt<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>(ModelClass: typeof Model<DB, TableName, IdColumnName>) {
  return class extends ModelClass {
    async beforeUpdate(data: Updateable<InsertObject<DB, TableName>>) {
      return {
        ...await super.beforeUpdate(data),
        updatedAt: sql`NOW()`,
      };
    }
  };
}
