import { NoResultError, sql, type Selectable } from 'kysely';

import Database from './Database';
import applyMixins from './utils/applyMixins';
import updatedAt from './mixins/updatedAt';
import slug from './mixins/slug';
import globalId from './mixins/globalId';

import isolateModels from './utils/isolateModels';

export {
  Database,

  // mixins
  updatedAt,
  slug,
  globalId,

  // utils
  isolateModels,
  applyMixins,

  // kysely reexport
  NoResultError,
  sql,
};

// types
export type ModelType<Table> = Selectable<Table>;
