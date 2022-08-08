import type Model from '../Model';

export default function isolateModels<Models extends { [key in keyof Models]: Model<any, any, any>}>(models: Models): Models {
  const isolatedModels: Models = {
    ...models,
  };

  const modelNames = Object.keys(models) as (keyof Models)[];

  modelNames.forEach((key) => {
    isolatedModels[key] = models[key].isolate() as Models[typeof key];
  });

  return isolatedModels;
}
