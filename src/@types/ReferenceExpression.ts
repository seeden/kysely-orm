type ReferenceExpression<DB, TableName extends keyof DB & string, ColumnName extends keyof DB[TableName] & string> = `${TableName}.${ColumnName}`;  

export default ReferenceExpression;
