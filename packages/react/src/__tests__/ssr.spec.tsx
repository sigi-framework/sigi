/* eslint-disable sonarjs/no-identical-functions */
import 'reflect-metadata'

import { GLOBAL_KEY_SYMBOL, EffectModule, ImmerReducer, Module, Effect, Reducer, RETRY_KEY_SYMBOL } from '@sigi/core'
import { Injectable, Injector } from '@sigi/di'
import { emitSSREffects, match } from '@sigi/ssr'
import { Action } from '@sigi/types'
import { Draft } from 'immer'
import { useEffect } from 'react'
import { renderToString } from 'react-dom/server'
import { create, act } from 'react-test-renderer'
import { Observable, of, timer } from 'rxjs'
import { endWith, switchMap, map, mergeMap, withLatestFrom } from 'rxjs/operators'

import { SSRContext, useModule } from '../index.browser'

interface CountState {
  count: number
  name: string
}

interface TipState {
  tip: string
}

@Injectable()
class Service {
  getName() {
    return of('client service')
  }
}

@Module('ServiceModule')
class ServiceModule extends EffectModule<CountState> {
  readonly defaultState = { count: 0, name: '' }

  constructor(public readonly service: Service) {
    super()
  }

  @ImmerReducer()
  setName(state: Draft<CountState>, name: string) {
    state.name = name
  }

  @Effect({
    ssr: true,
  })
  setNameEffect(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      switchMap(() =>
        this.service.getName().pipe(
          map((name) => this.getActions().setName(name)),
          endWith(this.terminate()),
        ),
      ),
    )
  }

  @Effect({
    payloadGetter: (ctx: { failure: boolean }, skip) => {
      if (!ctx.failure) {
        return skip
      }
      return 1
    },
  })
  setNameWithFailure(payload$: Observable<number | undefined>): Observable<Action> {
    return payload$.pipe(
      mergeMap((p) => {
        if (p) {
          return of(this.retryOnClient().setNameWithFailure(), this.terminate())
        }
        return of(this.getActions().setName('From retry'))
      }),
    )
  }
}

@Module('CountModel')
class CountModel extends EffectModule<CountState> {
  defaultState = { count: 0, name: '' }

  constructor(public readonly serviceModule: ServiceModule) {
    super()
  }

  @ImmerReducer()
  setCount(state: Draft<CountState>, count: number) {
    state.count = count
  }

  @ImmerReducer()
  setName(state: Draft<CountState>, name: string) {
    state.name = name
  }

  @Effect({
    ssr: true,
  })
  getCount(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      mergeMap(() =>
        timer(20).pipe(
          map(() => this.getActions().setCount(1)),
          endWith(this.terminate()),
        ),
      ),
    )
  }

  @Effect({
    payloadGetter: (ctx: { url: string }, skip) => ctx.url || skip,
    skipFirstClientDispatch: false,
  })
  skippedEffect(payload$: Observable<string>): Observable<Action> {
    return payload$.pipe(
      switchMap((name) =>
        timer(20).pipe(
          map(() => this.getActions().setName(name)),
          endWith(this.terminate()),
        ),
      ),
    )
  }

  @Effect({
    payloadGetter: (ctx: { name: string }, skip) => ctx.name || skip,
  })
  emitOtherEffect(payload$: Observable<string>): Observable<Action> {
    return payload$.pipe(
      switchMap((name) =>
        timer(20).pipe(
          map(() => this.serviceModule.getActions().setName(name)),
          endWith(this.terminate()),
        ),
      ),
    )
  }
}

interface InfinityWaitModelState {
  count: number
}

@Module('InfinityWaitModel')
class InfinityWaitModel extends EffectModule<InfinityWaitModelState> {
  defaultState = { count: 0 }

  @ImmerReducer()
  setCount(state: Draft<InfinityWaitModelState>, count: number) {
    state.count = count
  }

  @Effect({
    ssr: true,
  })
  infinityWait(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(map(() => this.getActions().setCount(1)))
  }
}

@Module('TipModel')
class TipModel extends EffectModule<TipState> {
  defaultState = { tip: '' }

  @ImmerReducer()
  setTip(state: Draft<TipState>, tip: string) {
    state.tip = tip
  }

  @Effect({ ssr: true })
  getTip(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      mergeMap(() =>
        timer(1).pipe(
          map(() => this.getActions().setTip('tip')),
          endWith(this.terminate()),
        ),
      ),
    )
  }
}

const Component = () => {
  const [state, actions] = useModule(CountModel)
  useEffect(() => {
    actions.setName('new name')
  }, [actions])

  return (
    <>
      <span>{state.count}</span>
    </>
  )
}

const ComponentWithSelector = () => {
  const [state, actions] = useModule(CountModel, {
    selector: (s) => ({
      count: s.count + 1,
    }),
    dependencies: [],
  })
  useEffect(() => {
    actions.setName('new name')
  }, [actions])

  return (
    <>
      <span>{state.count}</span>
    </>
  )
}

const MODULES = [CountModel, TipModel, ServiceModule, Service]

describe('SSR specs:', () => {
  it('should throw if module name not given', () => {
    function generateException() {
      // @ts-expect-error
      @Module()
      class ErrorModel extends EffectModule<any> {
        defaultState = {}
      }

      return ErrorModel
    }

    expect(generateException).toThrow()
  })

  it('should pass valid module name', () => {
    @Module('1')
    class Model extends EffectModule<any> {
      defaultState = {}
    }

    @Module('2')
    class Model2 extends EffectModule<any> {
      defaultState = {}
    }

    function generateException1() {
      @Module('1')
      class ErrorModel1 extends EffectModule<any> {
        defaultState = {}
      }

      return ErrorModel1
    }

    function generateException2() {
      @Module('1')
      class ErrorModel2 extends EffectModule<any> {
        defaultState = {}
      }

      return { ErrorModel2 }
    }

    // eslint-disable-next-line sonarjs/no-identical-functions
    function generateException3() {
      // @ts-expect-error
      @Module()
      class ErrorModel extends EffectModule<any> {
        defaultState = {}
      }

      return ErrorModel
    }

    expect(Model).not.toBe(undefined)
    expect(Model2).not.toBe(undefined)
    expect(generateException1).toThrow()
    expect(generateException2).toThrow()
    expect(generateException3).toThrow()
  })

  it('should run ssr effects', async () => {
    const state = await emitSSREffects({ url: 'name' } as any, [CountModel], {
      providers: MODULES,
    }).pendingState
    const moduleState = state['dataToPersist']['CountModel']
    expect(moduleState).not.toBe(undefined)
    expect(moduleState.count).toBe(1)
    expect(moduleState.name).toBe('name')
    expect(state['dataToPersist']).toMatchSnapshot()
  })

  it('should skip effect if it returns SKIP_SYMBOL', async () => {
    const state = await emitSSREffects({}, [CountModel], {
      providers: MODULES,
    }).pendingState
    const moduleState = state['dataToPersist']['CountModel']

    expect(moduleState.name).toBe('')
    expect(state['dataToPersist']).toMatchSnapshot()
  })

  it("should return right state if emit other module's effect", async () => {
    const state = await emitSSREffects({ name: 'foo' }, [CountModel], {
      providers: [],
    }).pendingState
    const moduleState = state['dataToPersist']['ServiceModule']
    expect(moduleState.name).toBe('foo')
    expect(state['dataToPersist']).toMatchSnapshot()
  })

  it('should return right state in hooks', async () => {
    const req = {}
    const { pendingState, injector } = emitSSREffects(req, [CountModel], {
      providers: MODULES,
    })
    await pendingState
    const html = renderToString(
      <SSRContext value={injector}>
        <Component />
      </SSRContext>,
    )
    expect(html).toContain('<span>1</span>')
    expect(html).toMatchSnapshot()
  })

  it('should restore state from global', () => {
    global[GLOBAL_KEY_SYMBOL] = {
      CountModel: {
        count: 101,
        name: '',
      },
    }
    const testRenderer = create(<Component />)
    act(() => {
      testRenderer.update(<Component />)
    })
    expect(testRenderer.root.findByType('span').children[0]).toBe('101')

    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })

  it('should restore state from global #with selector', () => {
    global[GLOBAL_KEY_SYMBOL] = {
      CountModel: {
        count: 10,
        name: '',
      },
    }
    const testRenderer = create(
      <SSRContext value={new Injector().addProviders(MODULES)}>
        <ComponentWithSelector />
      </SSRContext>,
    )
    expect(testRenderer.root.findByType('span').children[0]).toBe('11')
    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })

  it('should not restore state from global if state is null', () => {
    global[GLOBAL_KEY_SYMBOL] = {
      OtherModule: {
        count: 10,
        name: '',
      },
    }
    const injector = new Injector().addProviders(MODULES)
    const testRenderer = create(
      <SSRContext value={injector}>
        <ComponentWithSelector />
      </SSRContext>,
    )
    act(() => {
      testRenderer.update(
        <SSRContext value={injector}>
          <ComponentWithSelector />
        </SSRContext>,
      )
    })
    expect(testRenderer.root.findByType('span').children[0]).toBe('1')

    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })

  it('should restore and skip first action on client side', () => {
    const Component = () => {
      const [state, actions] = useModule(CountModel)
      useEffect(() => {
        actions.getCount()
      }, [actions])

      return (
        <>
          <span>{state.count}</span>
        </>
      )
    }

    global[GLOBAL_KEY_SYMBOL] = {
      CountModel: {
        count: 2,
        name: '',
      },
    }

    const injector = new Injector().addProviders(MODULES)

    const testRenderer = create(
      <SSRContext value={injector}>
        <Component />
      </SSRContext>,
    )

    act(() => {
      testRenderer.update(
        <SSRContext value={injector}>
          <Component />
        </SSRContext>,
      )
    })
    expect(testRenderer.root.findByType('span').children[0]).toBe('2')

    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })

  it('should retry action if needed on client side', () => {
    const Component = () => {
      const [state, dispatcher] = useModule(ServiceModule)
      useEffect(() => {
        dispatcher.setNameWithFailure(void 0)
      }, [dispatcher])

      return (
        <>
          <span>{state.name}</span>
        </>
      )
    }

    global[RETRY_KEY_SYMBOL] = {
      ServiceModule: ['setNameWithFailure'],
    }

    const injector = new Injector().addProviders(MODULES)

    const testRenderer = create(
      <SSRContext value={injector}>
        <Component />
      </SSRContext>,
    )

    // eslint-disable-next-line sonarjs/no-identical-functions
    act(() => {
      testRenderer.update(
        <SSRContext value={injector}>
          <Component />
        </SSRContext>,
      )
    })

    expect(testRenderer.root.findByType('span').children[0]).toBe('From retry')

    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })

  it('should timeout', async () => {
    const req = {}
    return emitSSREffects(req, [CountModel], { providers: MODULES, timeout: 0 }).pendingState.catch((e: Error) => {
      expect(e.message).toBe('Terminate timeout')
    })
  })

  // Do not use `Sinon.fakeTimers` here
  // It would cause `UnhandledPromiseRejection`
  it('should timeout #2', async () => {
    const req = {}
    const { pendingState } = emitSSREffects(req, [InfinityWaitModel, TipModel], {
      timeout: 2 / 1000,
    })
    await pendingState.catch((e) => {
      expect(e.message).toBe('Terminate timeout')
    })
  })

  it('should resolve empty object if no modules provided', async () => {
    const req = {}
    const state = await emitSSREffects(req, [], { providers: MODULES }).pendingState
    expect(state['dataToPersist']).toStrictEqual({})
  })

  it('should do nothing if Module contains no SSREffects', async () => {
    const req = {}
    @Module('WithoutSSR')
    class WithoutSSRModule extends EffectModule<{ count: number }> {
      defaultState = {
        count: 0,
      }

      @ImmerReducer()
      set(state: Draft<{ count: number }>, payload: number) {
        state.count = payload
      }

      @Effect()
      addOne(payload$: Observable<void>): Observable<Action> {
        return payload$.pipe(
          withLatestFrom(this.state$),
          map(([, { count }]) => this.getActions().set(count + 1)),
        )
      }
    }
    const state = await emitSSREffects(req, [WithoutSSRModule], { providers: MODULES }).pendingState
    expect(state['dataToPersist']).toStrictEqual({
      WithoutSSR: {
        count: 0,
      },
    })
  })

  it('should throw error if runEffects error', async () => {
    const req = {}
    const error = new TypeError('whatever')
    @Module('ErrorModule')
    class SSRErrorModule extends EffectModule<{ count: number }> {
      defaultState = {
        count: 0,
      }

      @Effect({ ssr: true })
      addOne(payload$: Observable<void>): Observable<Action> {
        return payload$.pipe(
          withLatestFrom(this.state$),
          map(() => {
            throw error
          }),
        )
      }
    }
    try {
      await emitSSREffects(req, [SSRErrorModule], { providers: MODULES }).pendingState
      throw new TypeError('Unreachable code path')
    } catch (e) {
      expect(e).toBe(error)
    }
  })

  it('should throw error if reducer throw', async () => {
    const req = {}
    const error = new TypeError('whatever')
    @Module('ErrorReducerModule')
    class SSRErrorModule extends EffectModule<{ count: number }> {
      defaultState = {
        count: 0,
      }

      @Reducer()
      set() {
        throw error
      }

      @Effect({ ssr: true })
      addOne(payload$: Observable<void>): Observable<Action> {
        return payload$.pipe(
          withLatestFrom(this.state$),
          map(() => this.getActions().set()),
        )
      }
    }
    try {
      await emitSSREffects(req, [SSRErrorModule], { providers: MODULES }).pendingState
      throw new TypeError('Unreachable code path')
    } catch (e) {
      expect(e).toBe(error)
    }
  })

  it('should throw error if payloadGetter throw', async () => {
    const req = {}
    const error = new TypeError('whatever')
    @Module('ErrorMiddlewareModule')
    class SSRErrorModule extends EffectModule<{ count: number }> {
      defaultState = {
        count: 0,
      }

      @Reducer()
      set(state: { count: number }, payload: number) {
        return { ...state, count: payload }
      }

      @Effect({
        payloadGetter: () => {
          throw error
        },
      })
      addOne(payload$: Observable<void>): Observable<Action> {
        return payload$.pipe(
          withLatestFrom(this.state$),
          map(([, state]) => this.getActions().set(state.count + 1)),
        )
      }
    }
    try {
      await emitSSREffects(req, [SSRErrorModule], { providers: MODULES }).pendingState
      throw new TypeError('Unreachable code path')
    } catch (e) {
      expect(e).toBe(error)
    }
  })

  it('should replace injector if providers provided', async () => {
    const req = {}
    const state = await emitSSREffects(req, [ServiceModule], { providers: MODULES }).pendingState
    expect(state['dataToPersist'].ServiceModule.name).toBe('client service')
    const state2 = await emitSSREffects(req, [ServiceModule], {
      providers: [...MODULES, { provide: Service, useValue: { getName: () => of('server service') } }],
    }).pendingState
    expect(state2['dataToPersist'].ServiceModule.name).toBe('server service')
  })

  it('should persist states which mutated by the other modules', async () => {
    @Module('InnerStateModule')
    class StateModel extends EffectModule<{ count: number }> {
      defaultState = { count: 0 }

      @ImmerReducer()
      setCount(state: Draft<{ count: number }>, count: number) {
        state.count = count
      }
    }

    @Module('InnerCountModel')
    // eslint-disable-next-line @typescript-eslint/ban-types
    class CountModel extends EffectModule<{}> {
      defaultState = {}

      constructor(private readonly stateModule: StateModel) {
        super()
      }

      @Effect({
        ssr: true,
      })
      getCount(payload$: Observable<void>): Observable<Action> {
        return payload$.pipe(
          mergeMap(() =>
            timer(20).pipe(
              map(() => this.stateModule.getActions().setCount(1)),
              endWith(this.terminate()),
            ),
          ),
        )
      }
    }

    const req = {}
    const state = await emitSSREffects(req, [CountModel, StateModel]).pendingState

    expect(state['dataToPersist']).toEqual({
      InnerCountModel: {},
      InnerStateModule: {
        count: 1,
      },
    })
  })

  it('should persist actions to retry if needed', async () => {
    const req = { failure: true }
    const state = await emitSSREffects(req, [ServiceModule], { providers: MODULES }).pendingState
    expect(state['actionsToRetry']).toEqual({ ServiceModule: ['setNameWithFailure'] })
  })

  it('should be able to persist actions to retry on the other module, and the skipped actions', async () => {
    @Module('InnerServiceModule')
    // eslint-disable-next-line @typescript-eslint/ban-types
    class InnerServiceModule extends EffectModule<CountState> {
      readonly defaultState = { count: 0, name: '' }

      constructor(public readonly service: Service) {
        super()
      }

      @ImmerReducer()
      setName(state: Draft<CountState>, name: string) {
        state.name = name
      }

      @Effect()
      setNameWithFailure(payload$: Observable<number | undefined>): Observable<Action> {
        return payload$.pipe(mergeMap(() => of(this.retryOnClient().setNameWithFailure(), this.terminate())))
      }
    }
    @Module('InnerCountModel2')
    // eslint-disable-next-line @typescript-eslint/ban-types
    class InnerCountModule2 extends EffectModule<{}> {
      defaultState = {}

      constructor(private readonly serviceModule: InnerServiceModule) {
        super()
      }

      @Effect({
        ssr: true,
      })
      setName(payload$: Observable<void>): Observable<Action> {
        return payload$.pipe(mergeMap(() => of(this.serviceModule.getActions().setNameWithFailure(1))))
      }

      @Effect({
        payloadGetter(_: any, skipAction) {
          return skipAction
        },
      })
      skippedSetName(payload$: Observable<void>): Observable<Action> {
        return payload$.pipe(map(() => this.serviceModule.getActions().setName('skipped')))
      }
    }

    const req = {}
    const state = await emitSSREffects(req, [InnerServiceModule, InnerCountModule2], { providers: MODULES })
      .pendingState

    expect(state['actionsToRetry']).toEqual({
      InnerCountModel2: ['skippedSetName'],
      InnerServiceModule: ['setNameWithFailure'],
    })
  })

  it('should support match fn', async () => {
    @Module('InnerServiceModule2')
    class InnerServiceModule2 extends EffectModule<CountState> {
      readonly defaultState = { count: 0, name: '' }

      @ImmerReducer()
      setName(state: Draft<CountState>, name: string) {
        state.name = name
      }

      @Effect({
        payloadGetter: match(
          ['/users/:id'],
          (ctx: any) => ctx.request.path,
        )((ctx) => {
          return ctx.request.path.length
        }),
      })
      setNameWithFailure(payload$: Observable<number>): Observable<Action> {
        return payload$.pipe(mergeMap((l) => of(this.getActions().setName(`length: ${l}`), this.terminate())))
      }
    }

    const req = {
      request: {
        path: '/users/linus',
      },
    }
    const state = await emitSSREffects(req, [InnerServiceModule2], { providers: [InnerServiceModule2] }).pendingState

    expect(state['dataToPersist']).toEqual({
      InnerServiceModule2: {
        count: 0,
        name: `length: ${req.request.path.length}`,
      },
    })
  })
})
