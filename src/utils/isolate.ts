import { type Model } from '../mixins/model';
import Constructor from '../@types/Constructor';
type Hash<T> = { [modelName: string]: T };

export default function isolate<
  // DB, 
  // TableName extends keyof DB & string,
  //IdColumnName extends keyof DB[TableName] & string,
  T extends Constructor<any>,
>(
  obj: Hash<T>
): Hash<T> {
  const result: Hash<T> = {};

  Object.keys(obj).forEach((key) => {
    const ModelClass = obj[key];

    result[key] = class IsolatedModel extends ModelClass {};
  });

  return result;
}
