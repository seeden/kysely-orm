import Constructor from '../@types/Constructor';

type IsolatedConstructor = Constructor<any> & { isolated: boolean };

export default function isolate<Models extends IsolatedConstructor[] | Record<string, IsolatedConstructor>>(models: Models): Models {
  if (Array.isArray(models)) {
    return models.map((model) => {
      class IsolatedModel extends model {};
      
      IsolatedModel.isolated = true;
      return IsolatedModel;
    }) as Models;
  }

  const isolatedModels: Record<string, IsolatedConstructor> = {};
  Object.keys(models).forEach((key) => {
    const model = models[key];
    class IsolatedModel extends model {};
    
    IsolatedModel.isolated = true;
    isolatedModels[key] = IsolatedModel;
  });

  return isolatedModels as Models;
}
