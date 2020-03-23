import { rootInjector } from './root-injector'

export function Injectable() {
  return function (target: any) {
    rootInjector.addProvider({
      useClass: target,
      provide: target,
    })
    return target
  }
}
