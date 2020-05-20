import 'reflect-metadata'

import { Inject, Test, Injectable, InjectionToken, AbstractTestModule } from '../index'
import { Injector } from '../injector'
import { rootInjector } from '../root-injector'

describe('testbed spec', () => {
  it('should resolve dep instance', () => {
    @Injectable()
    class Dep {}

    @Injectable()
    class Service {
      constructor(public dep: Dep) {}
    }

    const testModule = Test.createTestingModule().compile()
    const service = testModule.getInstance(Service)
    expect(service instanceof Service).toBeTruthy()
    expect(service.dep instanceof Dep).toBeTruthy()
  })

  it('should override when createTestingModule', () => {
    function whatever() {
      return true
    }

    function replacement() {
      return false
    }

    const token = new InjectionToken<typeof whatever>('replacable')

    rootInjector.addProvider({
      useValue: replacement,
      provide: token,
    })

    @Injectable()
    class Service {
      constructor(@Inject(token) public dep: typeof whatever) {}
    }

    const testModule = Test.createTestingModule({ providers: [{ provide: token, useValue: replacement }] }).compile()
    const service = testModule.getInstance(Service)
    expect(service instanceof Service).toBeTruthy()
    expect(service.dep).toBe(replacement)
    expect(service.dep()).toBe(false)
  })

  it('should override by overrideProvider method', () => {
    function whatever() {
      return true
    }

    function replacement() {
      return false
    }

    const token = new InjectionToken<typeof whatever>('replacabel')

    rootInjector.addProvider({
      useValue: replacement,
      provide: token,
    })

    @Injectable()
    class Service {
      constructor(@Inject(token) public dep: typeof whatever) {}
    }

    const testModule = Test.createTestingModule().overrideProvider(token).useValue(replacement).compile()
    const service = testModule.getInstance(Service)
    expect(service instanceof Service).toBeTruthy()
    expect(service.dep).toBe(replacement)
    expect(service.dep()).toBe(false)
  })

  it('should override class', () => {
    @Injectable()
    class Dep {}

    @Injectable()
    class Service {
      constructor(public dep: Dep) {}
    }

    @Injectable()
    class BetterDep {}

    const testModule = Test.createTestingModule().overrideProvider(Dep).useClass(BetterDep).compile()

    const service = testModule.getInstance(Service)
    expect(service instanceof Service).toBeTruthy()
    expect(service.dep instanceof BetterDep).toBeTruthy()
  })

  it('should ovrride factory', () => {
    const token = new InjectionToken<string>('whatever')

    rootInjector.addProvider({
      provide: token,
      useFactory: () => {
        return '1'
      },
    })

    @Injectable()
    class Service {
      constructor(@Inject(token) public fun: string) {}
    }

    const testModule = Test.createTestingModule()
      .overrideProvider(token)
      .useFactory(() => '2')
      .compile()

    const service = testModule.getInstance(Service)

    expect(service.fun).toBe('2')
  })

  it('should override TestModule', () => {
    class BetterTestModule implements AbstractTestModule {
      private readonly injector!: Injector

      getInstance<T>(target: any): T {
        return this.injector.getInstance(target)
      }
    }

    const testModule = Test.createTestingModule({
      TestModule: BetterTestModule,
    }).compile()

    expect(testModule instanceof BetterTestModule).toBeTruthy()
  })
})
