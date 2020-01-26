import { Injector } from './injector'
import { InjectionProvider } from './provider'

export class RootInjector extends Injector {
  provider = new InjectionProvider()

  reset() {
    this.provider = new InjectionProvider()
    this.providersCache.clear()
    this.resolvedProviders.clear()
  }
}

export const rootInjector = new RootInjector()
