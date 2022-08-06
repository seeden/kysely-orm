import { NoResultError } from 'kysely';

import Database from './Database';
import Model, { type ModelType } from './Model';
import applyPlugins from './plugins/applyPlugins';
import bindable from './plugins/bindable';
import updatedAt from './plugins/updatedAt';
import slug from './plugins/slug';
import globalId from './plugins/globalId';

export {
  Database,
  Model,

  applyPlugins,
  bindable,
  updatedAt,
  slug,
  globalId,

  NoResultError,
};

export type { ModelType };
