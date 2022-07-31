import type Model from './Model';

type ModelsBase = {
  [key: string]: Model<any, any, any>;
};

export default function transaction<Models extends ModelsBase>(models: Models, callback: (trxModels: Models) => Promise<any>) {
  const firstModel = Object.values(models)[0];
  return firstModel.db.transaction((trx) => {
    const trxModels: ModelsBase = {};
    for (const modelName in models) {
      trxModels[modelName] = models[modelName].bind(trx);
    }
    
    return callback(trxModels as Models);
  });
}