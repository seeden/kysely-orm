import type Constructor from "../@types/Constructor";
import type Database from "../Database";

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
): T1;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1 extends Constructor,
  T2,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
  mixin2: (base: T1, db: Database<DB>, table: TableName, id: IdColumnName) => T2,
): T2;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1 extends Constructor,
  T2 extends Constructor,
  T3,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
  mixin2: (base: T1, db: Database<DB>, table: TableName, id: IdColumnName) => T2,
  mixin3: (base: T2, db: Database<DB>, table: TableName, id: IdColumnName) => T3,
): T3;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1 extends Constructor,
  T2 extends Constructor,
  T3 extends Constructor,
  T4,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
  mixin2: (base: T1, db: Database<DB>, table: TableName, id: IdColumnName) => T2,
  mixin3: (base: T2, db: Database<DB>, table: TableName, id: IdColumnName) => T3,
  mixin4: (base: T3, db: Database<DB>, table: TableName, id: IdColumnName) => T4,
): T4;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1 extends Constructor,
  T2 extends Constructor,
  T3 extends Constructor,
  T4 extends Constructor,
  T5,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
  mixin2: (base: T1, db: Database<DB>, table: TableName, id: IdColumnName) => T2,
  mixin3: (base: T2, db: Database<DB>, table: TableName, id: IdColumnName) => T3,
  mixin4: (base: T3, db: Database<DB>, table: TableName, id: IdColumnName) => T4,
  mixin5: (base: T4, db: Database<DB>, table: TableName, id: IdColumnName) => T5,
): T5;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1 extends Constructor,
  T2 extends Constructor,
  T3 extends Constructor,
  T4 extends Constructor,
  T5 extends Constructor,
  T6,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
  mixin2: (base: T1, db: Database<DB>, table: TableName, id: IdColumnName) => T2,
  mixin3: (base: T2, db: Database<DB>, table: TableName, id: IdColumnName) => T3,
  mixin4: (base: T3, db: Database<DB>, table: TableName, id: IdColumnName) => T4,
  mixin5: (base: T4, db: Database<DB>, table: TableName, id: IdColumnName) => T5,
  mixin6: (base: T5, db: Database<DB>, table: TableName, id: IdColumnName) => T6,
): T6;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1 extends Constructor,
  T2 extends Constructor,
  T3 extends Constructor,
  T4 extends Constructor,
  T5 extends Constructor,
  T6 extends Constructor,
  T7,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
  mixin2: (base: T1, db: Database<DB>, table: TableName, id: IdColumnName) => T2,
  mixin3: (base: T2, db: Database<DB>, table: TableName, id: IdColumnName) => T3,
  mixin4: (base: T3, db: Database<DB>, table: TableName, id: IdColumnName) => T4,
  mixin5: (base: T4, db: Database<DB>, table: TableName, id: IdColumnName) => T5,
  mixin6: (base: T5, db: Database<DB>, table: TableName, id: IdColumnName) => T6,
  mixin7: (base: T6, db: Database<DB>, table: TableName, id: IdColumnName) => T7,
): T7;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1 extends Constructor,
  T2 extends Constructor,
  T3 extends Constructor,
  T4 extends Constructor,
  T5 extends Constructor,
  T6 extends Constructor,
  T7 extends Constructor,
  T8,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
  mixin2: (base: T1, db: Database<DB>, table: TableName, id: IdColumnName) => T2,
  mixin3: (base: T2, db: Database<DB>, table: TableName, id: IdColumnName) => T3,
  mixin4: (base: T3, db: Database<DB>, table: TableName, id: IdColumnName) => T4,
  mixin5: (base: T4, db: Database<DB>, table: TableName, id: IdColumnName) => T5,
  mixin6: (base: T5, db: Database<DB>, table: TableName, id: IdColumnName) => T6,
  mixin7: (base: T6, db: Database<DB>, table: TableName, id: IdColumnName) => T7,
  mixin8: (base: T7, db: Database<DB>, table: TableName, id: IdColumnName) => T8,
): T8;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1 extends Constructor,
  T2 extends Constructor,
  T3 extends Constructor,
  T4 extends Constructor,
  T5 extends Constructor,
  T6 extends Constructor,
  T7 extends Constructor,
  T8 extends Constructor,
  T9,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
  mixin2: (base: T1, db: Database<DB>, table: TableName, id: IdColumnName) => T2,
  mixin3: (base: T2, db: Database<DB>, table: TableName, id: IdColumnName) => T3,
  mixin4: (base: T3, db: Database<DB>, table: TableName, id: IdColumnName) => T4,
  mixin5: (base: T4, db: Database<DB>, table: TableName, id: IdColumnName) => T5,
  mixin6: (base: T5, db: Database<DB>, table: TableName, id: IdColumnName) => T6,
  mixin7: (base: T6, db: Database<DB>, table: TableName, id: IdColumnName) => T7,
  mixin8: (base: T7, db: Database<DB>, table: TableName, id: IdColumnName) => T8,
  mixin9: (base: T8, db: Database<DB>, table: TableName, id: IdColumnName) => T9,
): T9;

function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Constructor,
  T1 extends Constructor,
  T2 extends Constructor,
  T3 extends Constructor,
  T4 extends Constructor,
  T5 extends Constructor,
  T6 extends Constructor,
  T7 extends Constructor,
  T8 extends Constructor,
  T9 extends Constructor,
  T10,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  base: TBase,
  mixin1: (base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) => T1,
  mixin2?: (base: T1, db: Database<DB>, table: TableName, id: IdColumnName) => T2,
  mixin3?: (base: T2, db: Database<DB>, table: TableName, id: IdColumnName) => T3,
  mixin4?: (base: T3, db: Database<DB>, table: TableName, id: IdColumnName) => T4,
  mixin5?: (base: T4, db: Database<DB>, table: TableName, id: IdColumnName) => T5,
  mixin6?: (base: T5, db: Database<DB>, table: TableName, id: IdColumnName) => T6,
  mixin7?: (base: T6, db: Database<DB>, table: TableName, id: IdColumnName) => T7,
  mixin8?: (base: T7, db: Database<DB>, table: TableName, id: IdColumnName) => T8,
  mixin9?: (base: T8, db: Database<DB>, table: TableName, id: IdColumnName) => T9,
  mixin10?: (base: T9, db: Database<DB>, table: TableName, id: IdColumnName) => T10,
) {
  const Mixin1Class = mixin1(base, db, table, id);
  if (!mixin2) {
    return Mixin1Class;
  }

  const Mixin2Class = mixin2(Mixin1Class, db, table, id);
  if (!mixin3) {
    return Mixin2Class;
  }

  const Mixin3Class = mixin3(Mixin2Class, db, table, id);
  if (!mixin4) {
    return Mixin3Class;
  }

  const Mixin4Class = mixin4(Mixin3Class, db, table, id);
  if (!mixin5) {
    return Mixin4Class;
  }

  const Mixin5Class = mixin5(Mixin4Class, db, table, id);
  if (!mixin6) {
    return Mixin5Class;
  }

  const Mixin6Class = mixin6(Mixin5Class, db, table, id);
  if (!mixin7) {
    return Mixin6Class;
  }

  const Mixin7Class = mixin7(Mixin6Class, db, table, id);
  if (!mixin8) {
    return Mixin7Class;
  }

  const Mixin8Class = mixin8(Mixin7Class, db, table, id);
  if (!mixin9) {
    return Mixin8Class;
  }

  const Mixin9Class = mixin9(Mixin8Class, db, table, id);
  if (!mixin10) {
    return Mixin9Class;
  }
}

export default applyMixins;
