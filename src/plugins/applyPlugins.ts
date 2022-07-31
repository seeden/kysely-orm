import type Model from '../Model';

interface PluginFunction<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string> {
  (sourceModel: typeof Model<DB, TableName, IdColumnName>, table: TableName, id: IdColumnName): typeof Model<DB, TableName, IdColumnName>;
}

export default function applyPlugins<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>(
  BaseClass: typeof Model<DB, TableName, IdColumnName>,
  table: TableName,
  id: IdColumnName,
  plugins: PluginFunction<DB, TableName, IdColumnName>[]
) {
  let currentClass = BaseClass;

  plugins.forEach((plugin) => {
    currentClass = class extends plugin(currentClass, table, id) {};
  });

  return currentClass;
}
