import { type Model } from '../mixins/model';

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<any, DB, TableName, IdColumnName>,
>(
  base: TBase,
): TBase;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string,
  TBase extends Model<any, DB, TableName, IdColumnName>,
  T1,
>(
  base: TBase,
  applyMixin1: (base: TBase) => T1,
): T1;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<any, DB, TableName, IdColumnName>,
  T1,
  T2,
>(
  base: TBase,
  applyMixin1: (base: TBase) => T1,
  applyMixin2: (base: T1) => T2,
): T2;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<any, DB, TableName, IdColumnName>,
  T1,
  T2,
  T3,
>(
  base: TBase,
  applyMixin1: (base: TBase) => T1,
  applyMixin2: (base: T1) => T2,
  applyMixin3: (base: T2) => T3,
): T3;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<any, DB, TableName, IdColumnName>,
  T1,
  T2,
  T3,
  T4,
>(
  base: TBase,
  applyMixin1: (base: TBase) => T1,
  applyMixin2: (base: T1) => T2,
  applyMixin3: (base: T2) => T3,
  applyMixin4: (base: T3) => T4,
): T4;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<any, DB, TableName, IdColumnName>,
  T1,
  T2,
  T3,
  T4,
  T5,
>(
  base: TBase,
  applyMixin1: (base: TBase) => T1,
  applyMixin2: (base: T1) => T2,
  applyMixin3: (base: T2) => T3,
  applyMixin4: (base: T3) => T4,
  applyMixin5: (base: T4) => T5,
): T5;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<any, DB, TableName, IdColumnName>,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6
>(
  base: TBase,
  applyMixin1: (base: TBase) => T1,
  applyMixin2: (base: T1) => T2,
  applyMixin3: (base: T2) => T3,
  applyMixin4: (base: T3) => T4,
  applyMixin5: (base: T4) => T5,
  applyMixin6: (base: T5) => T6,
): T6;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<any, DB, TableName, IdColumnName>,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6,
>(
  base: TBase,
  applyMixin1?: (base: TBase) => T1,
  applyMixin2?: (base: T1) => T2,
  applyMixin3?: (base: T2) => T3,
  applyMixin4?: (base: T3) => T4,
  applyMixin5?: (base: T4) => T5,
  applyMixin6?: (base: T5) => T6,
) {
  if (!applyMixin1) {
    return base;
  }

  const mixin1Class = applyMixin1(base);
  if (!applyMixin2) {
    return mixin1Class;
  }

  const mixin2Class = applyMixin2(mixin1Class);
  if (!applyMixin3) {
    return mixin2Class;
  }

  const mixin3Class = applyMixin3(mixin2Class);
  if (!applyMixin4) {
    return mixin3Class;
  }

  const mixin4Class = applyMixin4(mixin3Class);
  if (!applyMixin5) {
    return mixin4Class;
  }

  const mixin5Class = applyMixin5(mixin4Class);
  if (!applyMixin6) {
    return mixin5Class;
  }

  const Mixin6Class = applyMixin6(mixin5Class);
  return Mixin6Class;
}

export default applyMixins;