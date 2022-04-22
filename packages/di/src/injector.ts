import { ReflectiveProvider } from './injector-provider'
import { InjectionProvider } from './provider'
import { Provider, ValueProvider, ClassProvider, FactoryProvider, Token, Type, InjectionToken } from './type'

export class Injector {
  readonly provider = new InjectionProvider()

  protected readonly resolvedProviders = new Map<ReflectiveProvider<unknown>, unknown>()
  protected readonly providersCache = new Map<Provider, ReflectiveProvider<unknown>>()

  constructor(protected readonly parent: Injector | null = null) {}

  addProvider<T extends Provider<any>>(provider: T): T {
    return this.provider.addProvider(provider)
  }

  addProviders(providers: Provider[]) {
    for (const provider of providers) {
      this.provider.addProvider(provider)
    }
    return this
  }

  getInstance<T>(provider: Provider<T>): T {
    return this.getInstanceInternal(provider, true)
  }

  resolveAndInstantiate<T>(provider: Provider<T>): T {
    return this.getInstanceInternal(provider, false)
  }

  createChild(providers: Provider<unknown>[]): Injector {
    const childInjector = new Injector(this)
    childInjector.addProviders(providers)
    return childInjector
  }

  private resolveReflectiveProvider<T>(provider: Provider<T>): ReflectiveProvider<T> | null {
    let reflectiveProvider: ReflectiveProvider<T> | null = null
    if (this.provider.findProviderByToken((provider as ValueProvider<T>).provide ?? provider)) {
      if (this.providersCache.has(provider)) {
        return this.providersCache.get(provider) as ReflectiveProvider<T>
      }
      reflectiveProvider = new ReflectiveProvider(provider)
      this.providersCache.set(provider, reflectiveProvider)
    }
    return reflectiveProvider
  }

  private getInstanceInternal<T>(provider: Provider<T>, useCache: boolean): T {
    let injector: Injector | null = this
    let instance: T | null = null
    let reflectiveProvider: ReflectiveProvider<T> | null = null
    const deps = this.findDeps(provider)
    while (injector) {
      reflectiveProvider = injector.resolveReflectiveProvider(provider)
      if (!reflectiveProvider) {
        injector = injector.parent
        continue
      }
      if (injector.resolvedProviders.has(reflectiveProvider)) {
        if (deps) {
          if (useCache && (injector === this || this.checkDependenciesClean(injector, deps))) {
            instance = injector.resolvedProviders.get(reflectiveProvider) as T
          } else {
            instance = this.resolveByReflectiveProvider(reflectiveProvider, useCache, this)
            if (useCache) {
              this.provider.addProvider(provider)
              this.providersCache.set(provider, reflectiveProvider)
              this.resolvedProviders.set(reflectiveProvider, instance)
            }
          }
        } else {
          instance = useCache
            ? (injector.resolvedProviders.get(reflectiveProvider) as T)
            : this.resolveByReflectiveProvider(reflectiveProvider, false, this)
        }
        break
      }
      instance = injector.resolveByReflectiveProvider(reflectiveProvider, useCache, this)
      if (instance) {
        if (useCache) {
          this.provider.addProvider(provider)
          this.providersCache.set(provider, reflectiveProvider)
          this.resolvedProviders.set(reflectiveProvider!, instance)
        }
        break
      }
      injector = injector.parent
    }
    if (!instance) {
      reflectiveProvider = new ReflectiveProvider(provider)
      throw new TypeError(`No provider for ${reflectiveProvider.name}!`)
    }
    return instance
  }

  private resolveByReflectiveProvider<T>(
    reflectiveProvider: ReflectiveProvider<T>,
    useCache = true,
    leaf = this,
  ): T | null {
    let instance: T | null = null
    const { provider, name } = reflectiveProvider
    if (typeof provider === 'function') {
      const deps: Array<Type<unknown> | InjectionToken<T>> = Reflect.getMetadata('design:paramtypes', provider) ?? []
      const depsInstance = deps.map((dep) => leaf.getInstanceInternal(leaf.findExisting(dep), useCache))
      instance = new provider(...depsInstance)
    } else if ('useValue' in provider) {
      instance = provider.useValue
    } else if ('useClass' in provider) {
      instance = leaf.getInstanceInternal(provider.useClass, useCache)
    } else if ('useFactory' in provider) {
      let deps: unknown[] = []
      if (provider.deps) {
        deps = provider.deps!.map((dep) => leaf.getInstanceInternal(leaf.findExisting(dep), useCache))
      }
      instance = provider.useFactory(...deps)
    } else if ('useExisting' in provider) {
      instance = leaf.getInstanceInternal(this.findExisting(provider.useExisting), useCache)
    }
    if (!instance) {
      throw new TypeError(`Can not resolve ${name}, it's not a valid provider`)
    }
    return instance
  }

  private findExisting<T>(token: Token<T>): Provider<T> {
    let provider: Provider<T> | null = null
    let injector: Injector | null = this
    while (injector) {
      provider = injector.provider.findProviderByToken(token)
      if (provider) {
        break
      }
      injector = injector.parent
    }

    if (!provider) {
      throw new TypeError(`No provider for ${(token as Type<T>).name ?? token.toString()}`)
    }
    return provider
  }

  private findDeps<T>(provider: Provider<T>): Token<unknown>[] | null | undefined {
    return typeof provider === 'function'
      ? Reflect.getMetadata('design:paramtypes', provider)
      : (provider as ClassProvider<T>).useClass
      ? Reflect.getMetadata('design:paramtypes', (provider as ClassProvider<T>).useClass)
      : (provider as FactoryProvider<T>).deps
      ? (provider as FactoryProvider<T>).deps
      : null
  }

  private checkDependenciesClean(leaf: Injector, deps: Token<unknown>[]): boolean {
    return deps.every((dep) => {
      const depInLeaf = leaf.findExisting(dep)
      const depInRoot = this.findExisting(dep)
      const isEqual = depInLeaf === depInRoot
      const deps = this.findDeps(depInLeaf)
      if (deps) {
        return this.checkDependenciesClean(leaf, deps) && isEqual
      }
      return isEqual
    })
  }
}
