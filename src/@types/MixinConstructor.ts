import Base from '../Base';
import Constructor from "./Constructor";

export type BaseConstructor             = typeof Base;

export type AnyFunction<A = any> = (...input: any[]) => A

type MixinConstructor<T extends AnyFunction> =
    T extends AnyFunction<infer M> ? (M extends Constructor<Base> ? M & BaseConstructor : M) : ReturnType<T>

export default MixinConstructor;
