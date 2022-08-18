
import model, { type Model } from '../mixins/model';
import Constructor  from '../@types/Constructor';
import Database from '../Database';
import assign from '../mixins/assign';

function applyMixins<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof DB[TableName] & string,
  T1 extends Constructor,
  Mixin1 extends <TBase extends Constructor, DB2, TableName2 extends keyof DB2 & string, IdColumnName2 extends keyof DB2[TableName2] & string>(base: Model<TBase, DB2, TableName2, IdColumnName2>) => T1,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  mixin1: Mixin1,
): T1 {
  const BaseClass = db.model(table, id);

  return mixin1(BaseClass);
}

export default applyMixins;
