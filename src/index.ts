import { type Selectable } from 'kysely';
export { NoResultError, sql, type Selectable } from 'kysely';

export { default as Database } from './Database';

export * from './constants';
export * from './mixins';
export * from './utils';

// types
export type ModelType<Table> = Selectable<Table>;
