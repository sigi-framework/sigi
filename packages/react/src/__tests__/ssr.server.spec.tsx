/* eslint-disable sonarjs/no-identical-functions */
import '@abraham/reflection'

import { GLOBAL_KEY_SYMBOL, EffectModule, ImmerReducer, Module, Effect, Reducer } from '@sigi/core'
import { emitSSREffects, match } from '@sigi/ssr'
import { Action } from '@sigi/types'
import { Draft } from 'immer'
import { useEffect } from 'react'
import { renderToString } from 'react-dom/server'
import { create, act } from 'react-test-renderer'
import { Observable, of, timer } from 'rxjs'
import { endWith, map, mergeMap, withLatestFrom } from 'rxjs/operators'

import { SSRContext, useModule } from '../index.browser'

import { CountModule, TipModule, Service, ServiceModule } from './__fixtures__'

interface InfinityWaitModelState {
  count: number
}
interface CountState {
  count: number
  name: string
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

const Component = () => {
  const [state, actions] = useModule(CountModule)
  useEffect(() => {
    actions.setName('new name')
  }, [actions])

  return <span>{state.count}</span>
}

const MODULES = [CountModule, TipModule, ServiceModule, Service]

describe('SSR server', () => {
  it('should run ssr effects', async () => {
    const state = await emitSSREffects({ url: 'name' } as any, [CountModule], {
      providers: MODULES,
    }).pendingState
    const moduleState = state['dataToPersist']['CountModule']
    expect(moduleState).not.toBe(undefined)
    expect(moduleState.count).toBe(1)
    expect(moduleState.name).toBe('name')
    expect(state['dataToPersist']).toMatchSnapshot()
  })

  it('should skip effect if it returns SKIP_SYMBOL', async () => {
    const state = await emitSSREffects({}, [CountModule], {
      providers: MODULES,
    }).pendingState
    const moduleState = state['dataToPersist']['CountModule']

    expect(moduleState.name).toBe('')
    expect(state['dataToPersist']).toMatchSnapshot()
  })

  it('should return right state in hooks', async () => {
    const req = {}
    const { pendingState, injector } = emitSSREffects(req, [CountModule], {
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
    // @ts-expect-error
    global[GLOBAL_KEY_SYMBOL] = {
      CountModule: {
        count: 101,
        name: '',
      },
    }
    const testRenderer = create(<Component />)
    act(() => {
      testRenderer.update(<Component />)
    })
    expect(testRenderer.root.findByType('span').children[0]).toBe('101')

    // @ts-expect-error
    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })

  it('should timeout', async () => {
    const req = {}
    return emitSSREffects(req, [CountModule], { providers: MODULES, timeout: 0 }).pendingState.catch((e: Error) => {
      expect(e.message).toBe('Terminate timeout')
    })
  })

  // Do not use `Sinon.fakeTimers` here
  // It would cause `UnhandledPromiseRejection`
  it('should timeout #2', async () => {
    const req = {}
    const { pendingState } = emitSSREffects(req, [InfinityWaitModel, TipModule], {
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
    expect(state['dataToPersist']).toStrictEqual({})
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

    @Module('InnerCountModule')
    // eslint-disable-next-line @typescript-eslint/ban-types
    class CountModule extends EffectModule<{}> {
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
    const state = await emitSSREffects(req, [CountModule, StateModel]).pendingState

    expect(state['dataToPersist']).toEqual({
      InnerCountModule: {},
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
    @Module('InnerCountModule2')
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
      InnerCountModule2: ['skippedSetName'],
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
