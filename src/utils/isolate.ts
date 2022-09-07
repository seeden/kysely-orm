import Constructor from '../@types/Constructor';

export default function isolate<Models extends Record<string, Constructor<any>>>(models: Models): Models {
  const keys: (keyof Models)[] = Object.keys(models);
  const isolatedModels = <Models>{};

  for (const key of keys) {
    const model = models[key];

    isolatedModels[key] = class IsolatedModel extends model {};
  }

  return isolatedModels;
}
