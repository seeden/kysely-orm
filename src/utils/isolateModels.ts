import { type Model } from '../mixins/model';

export default function isolateModels<Models extends Record<string, Model<any, any, any, any>>>(models: Models): Models {
  const isolatedModels: Models = {
    ...models,
  };

  const modelNames = Object.keys(models) as (keyof Models)[];

  modelNames.forEach((key) => {
    const ModelClass = models[key];
    isolatedModels[key] = ModelClass.isolate() as typeof ModelClass;
  });

  return isolatedModels;
}
