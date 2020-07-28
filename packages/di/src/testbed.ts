import { Injector } from './injector'
import { rootInjector } from './root-injector'
import { Type, InjectionToken, Provider, Token, ValueProvider } from './type'

export class Test<M extends AbstractTestModule> {
  static createTestingModule<M extends AbstractTestModule>(overrideConfig?: {
    TestModule?: Type<M>
    providers?: Provider[]
  }) {
    return new Test<M>(
      overrideConfig?.providers ? overrideConfig.providers : [],
      overrideConfig?.TestModule ? overrideConfig.TestModule : (TestModule as any),
    )
  }

  readonly providersMap = new Map<Token<unknown>, Provider>()

  private constructor(providers: Provider[], private readonly TestModule: Type<M>) {
    for (const provider of providers) {
      this.providersMap.set((provider as ValueProvider<unknown>).provide ?? provider, provider)
    }
  }

  overrideProvider<T>(token: Token<T>): MockProvider<T, M> {
    return new MockProvider(this, token)
  }

  compile() {
    const childInjector = rootInjector.createChild(Array.from(this.providersMap.values()))
    return new this.TestModule(childInjector)
  }
}

export class MockProvider<T, M extends AbstractTestModule> {
  constructor(private readonly test: Test<M>, private readonly token: Type<T> | InjectionToken<T>) {}

  useClass(value: Type<T>) {
    this.test.providersMap.set(this.token, { provide: this.token, useClass: value })
    return this.test
  }

  useValue(value: T) {
    this.test.providersMap.set(this.token, { provide: this.token, useValue: value })
    return this.test
  }

  useFactory(value: (...args: any[]) => any) {
    this.test.providersMap.set(this.token, { provide: this.token, useFactory: value })
    return this.test
  }
}

export abstract class AbstractTestModule {
  abstract getInstance<T>(provider: Provider<T>): T
}

export class TestModule implements AbstractTestModule {
  constructor(private readonly injector: Injector) {}

  getInstance<T>(token: Provider<T>): T {
    return this.injector.getInstance(token)
  }
}
