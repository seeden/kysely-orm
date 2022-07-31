import type Model from '../Model';
import type Database from '../Database';

export default function bindable<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>(table: TableName, id: IdColumnName) {
  return (ModelClass: typeof Model<DB, TableName, IdColumnName>) => {
    return class extends ModelClass {
      /*
      constructor(db: Database<DB>, table: TableName, id: IdColumnName) {
        super(db, table, id);
      }

      static bind<DB>(db: Database<DB>) {
        return new this(db, table, id);
      }
      */
    };
  }
}
