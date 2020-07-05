import { rootInjector } from './root-injector'
import { Provider } from './type'

export interface InjectableOptions {
  providers: Provider[]
}

export function Injectable(options?: InjectableOptions) {
  return function (target: any) {
    rootInjector.addProvider({
      useClass: target,
      provide: target,
    })
    for (const provider of options?.providers ?? []) {
      rootInjector.addProvider(provider)
    }
    return target
  }
}
