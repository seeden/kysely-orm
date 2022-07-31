import { type ModelBase } from './Model';

type Callback1<T1> = (model1: T1) => Promise<any>;
type Callback2<T1, T2> = (model1: T1, model2: T2) => Promise<any>;
type Callback3<T1, T2, T3> = (model1: T1, model2: T2, model3: T3) => Promise<any>;
type Callback4<T1, T2, T3, T4> = (model1: T1, model2: T2, model3: T3, model4: T4) => Promise<any>;
type Callback5<T1, T2, T3, T4, T5> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5) => Promise<any>;
type Callback6<T1, T2, T3, T4, T5, T6> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5, model6: T6) => Promise<any>;
type Callback7<T1, T2, T3, T4, T5, T6, T7> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5, model6: T6, model7: T7) => Promise<any>;
type Callback8<T1, T2, T3, T4, T5, T6, T7, T8> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5, model6: T6, model7: T7, model8: T8) => Promise<any>;
type Callback9<T1, T2, T3, T4, T5, T6, T7, T8, T9> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5, model6: T6, model7: T7, model8: T8, model9: T9) => Promise<any>;
type Callback10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5, model6: T6, model7: T7, model8: T8, model9: T9, model10: T10) => Promise<any>;
type Callback11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5, model6: T6, model7: T7, model8: T8, model9: T9, model10: T10, model11: T11) => Promise<any>;
type Callback12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5, model6: T6, model7: T7, model8: T8, model9: T9, model10: T10, model11: T11, model12: T12) => Promise<any>;
type Callback13<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5, model6: T6, model7: T7, model8: T8, model9: T9, model10: T10, model11: T11, model12: T12, model13: T13) => Promise<any>;
type Callback14<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14> = (model1: T1, model2: T2, model3: T3, model4: T4, model5: T5, model6: T6, model7: T7, model8: T8, model9: T9, model10: T10, model11: T11, model12: T12, model13: T13, model14: T14) => Promise<any>;

export default async function transaction<
  DB,
  T1 extends ModelBase<DB>,
  T2 extends ModelBase<DB>,
  T3 extends ModelBase<DB>,
  T4 extends ModelBase<DB>,
  T5 extends ModelBase<DB>,
  T6 extends ModelBase<DB>,
  T7 extends ModelBase<DB>,
  T8 extends ModelBase<DB>,
  T9 extends ModelBase<DB>,
  T10 extends ModelBase<DB>,
  T11 extends ModelBase<DB>,
  T12 extends ModelBase<DB>,
  T13 extends ModelBase<DB>,
  T14 extends ModelBase<DB>,
  T15 extends ModelBase<DB>,
>(
  model1: T1,
  model2: T2 | Callback1<T1>,
  model3?: T3 | Callback2<T1, T2>,
  model4?: T4 | Callback3<T1, T2, T3>,
  model5?: T5 | Callback4<T1, T2, T3, T4>,
  model6?: T6 | Callback5<T1, T2, T3, T4, T5>,
  model7?: T7 | Callback6<T1, T2, T3, T4, T5, T6>,
  model8?: T8 | Callback7<T1, T2, T3, T4, T5, T6, T7>,
  model9?: T9 | Callback8<T1, T2, T3, T4, T5, T6, T7, T8>,
  model10?: T10 | Callback9<T1, T2, T3, T4, T5, T6, T7, T8, T9>,
  model11?: T11 | Callback10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>,
  model12?: T12 | Callback11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>,
  model13?: T13 | Callback12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>,
  model14?: T14 | Callback13<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>,
  model15?: T15 | Callback14<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>,
) {
  return model1.db.transaction(async (db) => {
   if (typeof model2 === 'function') {
      return await model2(model1.bind(db) as T1);
   }

    if (typeof model3 === 'function') {
      return await model3(model1.bind(db) as T1, model2.bind(db) as T2);
    }

    if (typeof model4 === 'function' && model3) {
      return await model4(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3);
    }

    if (typeof model5 === 'function' && model3 && model4) {
      return await model5(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4);
    }

    if (typeof model6 === 'function' && model3 && model4 && model5) {
      return await model6(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5);
    }

    if (typeof model7 === 'function' && model3 && model4 && model5 && model6) {
      return await model7(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5, (model6 as T6).bind(db) as T6);
    }

    if (typeof model8 === 'function' && model3 && model4 && model5 && model6 && model7) {
      return await model8(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5, (model6 as T6).bind(db) as T6, (model7 as T7).bind(db) as T7);
    }

    if (typeof model9 === 'function' && model3 && model4 && model5 && model6 && model7 && model8) {
      return await model9(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5, (model6 as T6).bind(db) as T6, (model7 as T7).bind(db) as T7, (model8 as T8).bind(db) as T8);
    }

    if (typeof model10 === 'function' && model3 && model4 && model5 && model6 && model7 && model8 && model9) {
      return await model10(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5, (model6 as T6).bind(db) as T6, (model7 as T7).bind(db) as T7, (model8 as T8).bind(db) as T8, (model9 as T9).bind(db) as T9);
    }

    if (typeof model11 === 'function' && model3 && model4 && model5 && model6 && model7 && model8 && model9 && model10) {
      return await model11(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5, (model6 as T6).bind(db) as T6, (model7 as T7).bind(db) as T7, (model8 as T8).bind(db) as T8, (model9 as T9).bind(db) as T9, (model10 as T10).bind(db) as T10);
    }

    if (typeof model12 === 'function' && model3 && model4 && model5 && model6 && model7 && model8 && model9 && model10 && model11) {
      return await model12(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5, (model6 as T6).bind(db) as T6, (model7 as T7).bind(db) as T7, (model8 as T8).bind(db) as T8, (model9 as T9).bind(db) as T9, (model10 as T10).bind(db) as T10, (model11 as T11).bind(db) as T11);
    }

    if (typeof model13 === 'function' && model3 && model4 && model5 && model6 && model7 && model8 && model9 && model10 && model11 && model12) {
      return await model13(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5, (model6 as T6).bind(db) as T6, (model7 as T7).bind(db) as T7, (model8 as T8).bind(db) as T8, (model9 as T9).bind(db) as T9, (model10 as T10).bind(db) as T10, (model11 as T11).bind(db) as T11, (model12 as T12).bind(db) as T12);
    }

    if (typeof model14 === 'function' && model3 && model4 && model5 && model6 && model7 && model8 && model9 && model10 && model11 && model12 && model13) {
      return await model14(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5, (model6 as T6).bind(db) as T6, (model7 as T7).bind(db) as T7, (model8 as T8).bind(db) as T8, (model9 as T9).bind(db) as T9, (model10 as T10).bind(db) as T10, (model11 as T11).bind(db) as T11, (model12 as T12).bind(db) as T12, (model13 as T13).bind(db) as T13);
    }

    if (typeof model15 === 'function' && model3 && model4 && model5 && model6 && model7 && model8 && model9 && model10 && model11 && model12 && model13 && model14) {
      return await model15(model1.bind(db) as T1, model2.bind(db) as T2, model3.bind(db) as T3, (model4 as T4).bind(db) as T4, (model5 as T5).bind(db) as T5, (model6 as T6).bind(db) as T6, (model7 as T7).bind(db) as T7, (model8 as T8).bind(db) as T8, (model9 as T9).bind(db) as T9, (model10 as T10).bind(db) as T10, (model11 as T11).bind(db) as T11, (model12 as T12).bind(db) as T12, (model13 as T13).bind(db) as T13, (model14 as T14).bind(db) as T14);
    }
  });
}
