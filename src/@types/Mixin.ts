export type AnyFunction<A = any> = (...input: any[]) => A
export type AnyConstructor<A = object> = new (...input: any[]) => A

type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>;

export default Mixin;
