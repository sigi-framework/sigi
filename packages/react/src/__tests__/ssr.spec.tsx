import 'reflect-metadata'

import { TERMINATE_ACTION, GLOBAL_KEY, EffectModule, ImmerReducer, Module, Effect, Reducer } from '@sigi/core'
import { rootInjector } from '@sigi/di'
import { emitSSREffects, SSRStateCacheInstance } from '@sigi/ssr'
import { Action } from '@sigi/types'
import { Draft } from 'immer'
import uniqueId from 'lodash/uniqueId'
import React, { useEffect } from 'react'
import { renderToString } from 'react-dom/server'
import { create, act } from 'react-test-renderer'
import { Observable, timer } from 'rxjs'
import { endWith, switchMap, map, mergeMap, flatMap, withLatestFrom } from 'rxjs/operators'

import { SSRSharedContext, SSRContext, useModule, useModuleState } from '../index'

interface CountState {
  count: number
  name: string
}

interface TipState {
  tip: string
}

@Module('CountModel')
class CountModel extends EffectModule<CountState> {
  defaultState = { count: 0, name: '' }

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
      flatMap(() =>
        timer(20).pipe(
          map(() => this.getActions().setCount(1)),
          endWith(TERMINATE_ACTION),
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
          endWith(TERMINATE_ACTION),
        ),
      ),
    )
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
          endWith(TERMINATE_ACTION),
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

describe('SSR specs:', () => {
  beforeEach(() => {
    SSRStateCacheInstance.setPoolSize(100)
    rootInjector.addProviders([CountModel, TipModel])
  })

  afterEach(() => {
    SSRStateCacheInstance.setPoolSize(0)
    rootInjector.reset()
  })

  it('should throw if module name not given', () => {
    function generateException() {
      @((Module as any)())
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

    function generateException3() {
      @((Module as any)())
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
    const state = await emitSSREffects({ url: 'name' } as any, [CountModel])
    const moduleState = state['dataToPersist']['CountModel']
    expect(moduleState).not.toBe(undefined)
    expect(moduleState.count).toBe(1)
    expect(moduleState.name).toBe('name')
    expect(state['dataToPersist']).toMatchSnapshot()
  })

  it('should skip effect if it returns SKIP_SYMBOL', async () => {
    const state = await emitSSREffects({} as any, [CountModel])
    const moduleState = state['dataToPersist']['CountModel']

    expect(moduleState.name).toBe('')
    expect(state['dataToPersist']).toMatchSnapshot()
  })

  it('should return right state in hooks', async () => {
    const req = {}
    await emitSSREffects(req, [CountModel])
    const html = renderToString(
      <SSRContext.Provider value={req}>
        <Component />
      </SSRContext.Provider>,
    )
    expect(html).toContain('<span>1</span>')
    expect(html).toMatchSnapshot()
  })

  it('should restore state from global', () => {
    global[GLOBAL_KEY] = {
      CountModel: {
        count: 1,
        name: '',
      },
    }
    const testRenderer = create(<Component />)
    act(() => {
      testRenderer.update(<Component />)
    })
    expect(testRenderer.root.findByType('span').children[0]).toBe('1')

    delete global[GLOBAL_KEY]
    testRenderer.unmount()
  })

  it('should restore state from global #with selector', () => {
    global[GLOBAL_KEY] = {
      CountModel: {
        count: 10,
        name: '',
      },
    }
    const testRenderer = create(<ComponentWithSelector />)
    expect(testRenderer.root.findByType('span').children[0]).toBe('11')
    delete global[GLOBAL_KEY]
    testRenderer.unmount()
  })

  it('should not restore state from global if state is null', () => {
    global[GLOBAL_KEY] = {
      OtherModule: {
        count: 10,
        name: '',
      },
    }
    const testRenderer = create(<ComponentWithSelector />)
    act(() => {
      testRenderer.update(<ComponentWithSelector />)
    })
    expect(testRenderer.root.findByType('span').children[0]).toBe('1')

    delete global[GLOBAL_KEY]
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

    global[GLOBAL_KEY] = {
      CountModel: {
        count: 2,
        name: '',
      },
    }

    const testRenderer = create(<Component />)

    act(() => {
      testRenderer.update(<Component />)
    })
    expect(testRenderer.root.findByType('span').children[0]).toBe('2')

    delete global[GLOBAL_KEY]
    testRenderer.unmount()
  })

  it('should support concurrency', async () => {
    return Promise.all([
      emitSSREffects({ url: 'name1' }, [CountModel, TipModel], 'concurrency1'),
      emitSSREffects({ url: 'name2' }, [CountModel, TipModel], 'concurrency2'),
    ]).then(([result1, result2]) => {
      expect(result1['dataToPersist']['CountModel'].name).toBe('name1')
      expect(result2['dataToPersist']['CountModel'].name).toBe('name2')
      expect({
        firstRequest: result1['dataToPersist'],
        secondRequest: result2['dataToPersist'],
      }).toMatchSnapshot()
    })
  })

  it('should timeout', async () => {
    const req = {}
    const reqContext = uniqueId()
    return emitSSREffects(req, [CountModel], reqContext, 0).catch((e: Error) => {
      expect(e.message).toBe('Terminate timeout')
    })
  })

  it('should resolve empty object if no modules provided', async () => {
    const req = {}
    const state = await emitSSREffects(req, [])
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
    const state = await emitSSREffects(req, [WithoutSSRModule])
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
      await emitSSREffects(req, [SSRErrorModule])
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
      await emitSSREffects(req, [SSRErrorModule])
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
      await emitSSREffects(req, [SSRErrorModule])
      throw new TypeError('Unreachable code path')
    } catch (e) {
      expect(e).toBe(error)
    }
  })

  it('should reuse state if provider context', async () => {
    const requestId = uniqueId()
    const req1 = {}
    const req2 = {}
    await emitSSREffects(req1, [CountModel], requestId)
    await emitSSREffects(req2, [CountModel], requestId)
    const SharedComponent1 = () => {
      const state = useModuleState(CountModel)
      return (
        <>
          <span>{state.count}</span>
        </>
      )
    }

    const SharedComponent2 = () => {
      const state = useModuleState(CountModel)
      return (
        <>
          <span>{state.count}</span>
        </>
      )
    }
    const cachedState = SSRStateCacheInstance.get(requestId, CountModel)!
    expect(cachedState.getState().count).toBe(1)

    const result1 = renderToString(
      <SSRSharedContext.Provider value={requestId}>
        <SharedComponent1 />
      </SSRSharedContext.Provider>,
    )
    const result2 = renderToString(
      <SSRSharedContext.Provider value={requestId}>
        <SharedComponent2 />
      </SSRSharedContext.Provider>,
    )

    expect(result1).toBe(result2)
  })
})
