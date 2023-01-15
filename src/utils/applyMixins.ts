import { NoResultError } from 'kysely';
import Database from '../Database';
import model, { type Model } from '../mixins/model';

export default function applyMixins<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string,
>(db: Database<DB>, table: TableName, id: IdColumnName, error?: typeof NoResultError) {
  const BaseClass = model(db, table, id, error);

  function process(): typeof BaseClass;
  function process<
    T1,
  >(mixin1: (base: Model<DB, TableName, IdColumnName>) => T1): T1;

  function process<
    T1,
    T2,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
  ): T2;

  function process<
    T1,
    T2,
    T3,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
  ): T3;

  function process<
    T1,
    T2,
    T3,
    T4,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
  ): T4;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
    mixin5: (base: T4) => T5,
  ): T5;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
    mixin5: (base: T4) => T5,
    mixin6: (base: T5) => T6,
  ): T6;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
    mixin5: (base: T4) => T5,
    mixin6: (base: T5) => T6,
    mixin7: (base: T6) => T7,
  ): T7;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
    mixin5: (base: T4) => T5,
    mixin6: (base: T5) => T6,
    mixin7: (base: T6) => T7,
    mixin8: (base: T7) => T8,
  ): T8;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
    T9,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
    mixin5: (base: T4) => T5,
    mixin6: (base: T5) => T6,
    mixin7: (base: T6) => T7,
    mixin8: (base: T7) => T8,
    mixin9: (base: T8) => T9,
  ): T9;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
    T9,
    T10,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
    mixin5: (base: T4) => T5,
    mixin6: (base: T5) => T6,
    mixin7: (base: T6) => T7,
    mixin8: (base: T7) => T8,
    mixin9: (base: T8) => T9,
    mixin10: (base: T9) => T10,
  ): T10;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
    T9,
    T10,
    T11,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
    mixin5: (base: T4) => T5,
    mixin6: (base: T5) => T6,
    mixin7: (base: T6) => T7,
    mixin8: (base: T7) => T8,
    mixin9: (base: T8) => T9,
    mixin10: (base: T9) => T10,
    mixin11: (base: T10) => T11,
  ): T11;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
    T9,
    T10,
    T11,
    T12,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
    mixin5: (base: T4) => T5,
    mixin6: (base: T5) => T6,
    mixin7: (base: T6) => T7,
    mixin8: (base: T7) => T8,
    mixin9: (base: T8) => T9,
    mixin10: (base: T9) => T10,
    mixin11: (base: T10) => T11,
    mixin12: (base: T11) => T12,
  ): T12;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
    T9,
    T10,
    T11,
    T12,
    T13,
  >(
    mixin1: (base: Model<DB, TableName, IdColumnName>) => T1,
    mixin2: (base: T1) => T2,
    mixin3: (base: T2) => T3,
    mixin4: (base: T3) => T4,
    mixin5: (base: T4) => T5,
    mixin6: (base: T5) => T6,
    mixin7: (base: T6) => T7,
    mixin8: (base: T7) => T8,
    mixin9: (base: T8) => T9,
    mixin10: (base: T9) => T10,
    mixin11: (base: T10) => T11,
    mixin12: (base: T11) => T12,
    mixin13: (base: T12) => T13,
  ): T13;

  function process<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
    T9,
    T10,
    T11,
    T12,
    T13,
  >(
    mixin1?: (base: Model<DB, TableName, IdColumnName>) => T1, 
    mixin2?: (base: T1) => T2,
    mixin3?: (base: T2) => T3,
    mixin4?: (base: T3) => T4,
    mixin5?: (base: T4) => T5,
    mixin6?: (base: T5) => T6,
    mixin7?: (base: T6) => T7,
    mixin8?: (base: T7) => T8,
    mixin9?: (base: T8) => T9,
    mixin10?: (base: T9) => T10,
    mixin11?: (base: T10) => T11,
    mixin12?: (base: T11) => T12,
    mixin13?: (base: T12) => T13,
  ) {
    if (!mixin1) {
      return BaseClass;
    }

    if (!mixin2) {
      return mixin1(BaseClass);
    }
  
    if (!mixin3) {
      return mixin2(mixin1(BaseClass));
    }

    if (!mixin4) {
      return mixin3(mixin2(mixin1(BaseClass)));
    }

    if (!mixin5) {
      return mixin4(mixin3(mixin2(mixin1(BaseClass))));
    }

    if (!mixin6) {
      return mixin5(mixin4(mixin3(mixin2(mixin1(BaseClass)))));
    }

    if (!mixin7) {
      return mixin6(mixin5(mixin4(mixin3(mixin2(mixin1(BaseClass))))));
    }

    if (!mixin8) {
      return mixin7(mixin6(mixin5(mixin4(mixin3(mixin2(mixin1(BaseClass)))))));
    }

    if (!mixin9) {
      return mixin8(mixin7(mixin6(mixin5(mixin4(mixin3(mixin2(mixin1(BaseClass))))))));
    }

    if (!mixin10) {
      return mixin9(mixin8(mixin7(mixin6(mixin5(mixin4(mixin3(mixin2(mixin1(BaseClass)))))))));
    }

    if (!mixin11) {
      return mixin10(mixin9(mixin8(mixin7(mixin6(mixin5(mixin4(mixin3(mixin2(mixin1(BaseClass))))))))));
    }

    if (!mixin12) {
      return mixin11(mixin10(mixin9(mixin8(mixin7(mixin6(mixin5(mixin4(mixin3(mixin2(mixin1(BaseClass)))))))))));
    }

    if (!mixin13) {
      return mixin12(mixin11(mixin10(mixin9(mixin8(mixin7(mixin6(mixin5(mixin4(mixin3(mixin2(mixin1(BaseClass))))))))))));
    }

    return mixin13(mixin12(mixin11(mixin10(mixin9(mixin8(mixin7(mixin6(mixin5(mixin4(mixin3(mixin2(mixin1(BaseClass)))))))))))));
  }

  return process;
}
