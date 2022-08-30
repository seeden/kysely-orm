import type ReferenceExpression from '../@types/ReferenceExpression';

export default function parseReferenceExpression<
  DB, 
  TableName extends keyof DB & string, 
  ColumnName extends keyof DB[TableName] & string,
>(value: ReferenceExpression<DB, TableName, ColumnName>) {
  return value.split('.') as [TableName, ColumnName];
}