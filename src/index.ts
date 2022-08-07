import { NoResultError } from 'kysely';

import Database from './Database';
import Model, { type ModelType } from './Model';
import applyPlugins from './plugins/applyPlugins';
import updatedAt from './plugins/updatedAt';
import slug from './plugins/slug';
import globalId from './plugins/globalId';

export {
  Database,
  Model,

  applyPlugins,
  updatedAt,
  slug,
  globalId,

  NoResultError,
};

export type { ModelType };
