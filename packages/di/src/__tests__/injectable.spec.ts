import 'reflect-metadata'

import { Inject, InjectionToken, Injectable, rootInjector } from '../index'

describe('injectable specs', () => {
  afterEach(() => {
    rootInjector.reset()
  })

  it('should get single instance', () => {
    @Injectable()
    class Single {}

    const instance = rootInjector.getInstance(Single)

    expect(instance instanceof Single).toBeTruthy()
  })

  it('should get same instance after add new provider', () => {
    @Injectable()
    class Single {}

    class NewOne {}

    const instance1 = rootInjector.getInstance(Single)
    rootInjector.addProvider(NewOne)
    const instance2 = rootInjector.getInstance(Single)

    expect(instance1).toBe(instance2)
  })

  it('should get same instance after override providers', () => {
    @Injectable()
    class Single {}

    class NewOne {}

    class AddedOne {}

    const injector = rootInjector
    const addedInjector = injector.createChild([AddedOne, NewOne])
    const instance1 = injector.getInstance(Single)
    const instance2 = addedInjector.getInstance(Single)

    expect(instance1).toBe(instance2)
  })

  it('should get dependencies', () => {
    @Injectable()
    class Dep {}

    @Injectable()
    class DepTwo {
      constructor(public dep: Dep) {}
    }

    @Injectable()
    class Service {
      constructor(public dep: Dep, public depTwo: DepTwo) {}
    }

    const injector = rootInjector
    const service = injector.getInstance(Service)

    expect(injector.getInstance(Dep) instanceof Dep).toBeTruthy()
    expect(injector.getInstance(DepTwo) instanceof DepTwo).toBeTruthy()
    expect(service instanceof Service).toBeTruthy()
  })

  it('should singleton by default', () => {
    @Injectable()
    class Dep {}

    @Injectable()
    class DepTwo {
      constructor(public dep: Dep) {}
    }

    @Injectable()
    class Service {
      constructor(public dep: Dep, public depTwo: DepTwo) {}
    }

    const injector = rootInjector

    const service = injector.getInstance(Service)
    const dep = injector.getInstance(Dep)
    const depTwo = injector.getInstance(DepTwo)

    expect(service.dep).toBe(dep)
    expect(service.depTwo).toBe(depTwo)
  })

  it('should be able to inject by useValue', () => {
    function whatever() {}
    const token = new InjectionToken<typeof whatever>('whatever')

    rootInjector.addProvider({
      provide: token,
      useValue: whatever,
    })

    @Injectable()
    class Service {
      constructor(@Inject(token) public dep: typeof whatever) {}
    }

    const injector = rootInjector
    const service = injector.getInstance(Service)
    expect(service instanceof Service).toBeTruthy()
    expect(service.dep).toBe(whatever)
  })

  it('should be able to replace provide', () => {
    const rawClientProvide = rootInjector.addProvider({
      provide: new InjectionToken('raw-client'),
      useValue: Object.create(null),
    })

    const queryProvider = rootInjector.addProvider({
      provide: new InjectionToken('query'),
      useFactory: (client: any) =>
        Object.create({
          client: client,
        }),
      deps: [rawClientProvide.provide],
    })

    @Injectable()
    class Client {
      constructor(@Inject(queryProvider.provide) public query: any) {}
    }

    @Injectable()
    class Module {
      constructor(public client: Client) {}
    }

    const childInjector = rootInjector.createChild([
      {
        provide: rawClientProvide.provide,
        useValue: new Date(),
      },
    ])

    const oldM = rootInjector.getInstance(Module)
    const m = childInjector.getInstance(Module)

    expect(oldM).not.toBe(m)
    expect(m.client.query.client instanceof Date).toBeTruthy()
  })

  it('should be able to inject by useFactory', () => {
    class Dep {
      constructor(public cacheSize: number) {}
    }

    const cacheSize = 5

    const token = new InjectionToken<Dep>('whatever')

    rootInjector.addProvider({
      provide: token,
      useFactory() {
        return new Dep(cacheSize)
      },
    })

    @Injectable()
    class Service {
      constructor(@Inject(token) public dep: Dep) {}
    }

    const injector = rootInjector
    const service = injector.getInstance(Service)

    expect(service.dep instanceof Dep).toBeTruthy()
    expect(service.dep.cacheSize).toBe(cacheSize)
  })

  it('should be able to resolve deps from useFactory', () => {
    @Injectable()
    class Dep {
      constructor(public cacheSize: number, public depTwo: DepTwo) {}
    }

    @Injectable()
    class DepTwo {}

    const cacheSize = 5

    const token = new InjectionToken<Dep>('whatever')

    rootInjector.addProvider({
      provide: token,
      useFactory(depTwo: DepTwo) {
        return new Dep(cacheSize, depTwo)
      },
      deps: [DepTwo],
    })

    @Injectable()
    class Service {
      constructor(@Inject(token) public dep: Dep) {}
    }

    const injector = rootInjector

    const service = injector.getInstance(Service)
    const depTwo = injector.getInstance(DepTwo)

    expect(service.dep instanceof Dep).toBeTruthy()
    expect(service.dep.cacheSize).toBe(cacheSize)
    expect(depTwo instanceof DepTwo).toBeTruthy()
    expect(service.dep.depTwo).toBe(depTwo)
  })

  it('should be able to inject by useClass', () => {
    @Injectable()
    class Dep {
      constructor() {}
    }

    const token = new InjectionToken<Dep>('whatever')

    rootInjector.addProvider({
      provide: token,
      useClass: Dep,
    })

    @Injectable()
    class Service {
      constructor(@Inject(token) public dep: Dep) {}
    }

    const injector = rootInjector
    const service = injector.getInstance(Service)

    expect(service instanceof Service).toBeTruthy()
    expect(service.dep instanceof Dep).toBeTruthy()
  })

  it('should initialize without cache #1', () => {
    @Injectable()
    class Dep {}

    @Injectable()
    class Service {
      constructor(public readonly dep: Dep) {}
    }

    const injector = rootInjector

    const dep = injector.resolveAndInstantiate<Dep>(Dep)
    const service = injector.getInstance(Service)
    expect(dep).not.toBe(service.dep)
  })

  it('should initialize without cache #2', () => {
    @Injectable()
    class Dep {}

    const injector = rootInjector

    const dep1 = injector.resolveAndInstantiate(Dep)
    const dep2 = injector.resolveAndInstantiate(Dep)
    expect(dep1).not.toBe(dep2)
  })

  it('should initialize without cache #3', () => {
    @Injectable()
    class Dep {}

    const injector = rootInjector

    const dep1 = injector.resolveAndInstantiate(Dep)
    const dep2 = injector.getInstance(Dep)
    const dep3 = injector.resolveAndInstantiate(Dep)
    expect(dep1).not.toBe(dep2)
    expect(dep3).not.toBe(dep1)
    expect(dep3).not.toBe(dep2)
  })

  it('should resolve and create new injector', () => {
    class Dep {
      constructor() {}
    }

    const token = new InjectionToken<Dep>('whatever')

    rootInjector.addProvider({
      provide: token,
      useClass: Dep,
    })

    @Injectable()
    class Service {
      constructor(@Inject(token) public dep: Dep) {}
    }

    const replacementProvider = {
      provide: token,
      useValue: 1,
    }

    const newInjector = rootInjector.createChild([replacementProvider])
    const service = newInjector.getInstance(Service)
    expect(service.dep).toBe(1)
  })
})
