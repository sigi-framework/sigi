import { Type, InjectionToken } from './type'

export function Inject<T>(token: Type<T> | InjectionToken<T>) {
  return function <U>(target: Type<U>, _key: string, paramIndex: number) {
    const deps = Reflect.getMetadata('design:paramtypes', target)
    deps[paramIndex] = token
  }
}
