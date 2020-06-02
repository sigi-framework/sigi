import 'reflect-metadata'

import { rootInjector } from '@sigi/di'
import { Action, IStore } from '@sigi/types'
import { Draft } from 'immer'
import { Observable, noop } from 'rxjs'
import { delay, map, withLatestFrom, takeUntil, tap } from 'rxjs/operators'
import * as Sinon from 'sinon'

import { Effect, Reducer, ImmerReducer, DefineAction } from '../decorators'
import { EffectModule } from '../module'
import { Module } from '../module.decorator'
import { InstanceActionOfEffectModule } from '../types'

interface CounterState {
  count: number
}

const TIME_TO_DELAY = 300

@Module('counter')
class Counter extends EffectModule<CounterState> {
  defaultState = {
    count: 1,
  }

  @DefineAction() dispose$!: Observable<void>

  @ImmerReducer()
  setCountImmer(state: Draft<CounterState>, payload: Date) {
    state.count = payload.valueOf()
  }

  @ImmerReducer()
  addCountOneImmer(state: Draft<CounterState>) {
    state.count = state.count + 1
  }

  @Reducer()
  addOne(state: CounterState) {
    return { ...state, count: state.count + 1 }
  }

  @Reducer()
  setCount(state: CounterState, payload: number) {
    return { ...state, count: payload }
  }

  @Effect()
  asyncAddCount(payload$: Observable<number>): Observable<Action> {
    return payload$.pipe(
      delay(TIME_TO_DELAY),
      map((payload) => this.getActions().asyncAddCountString(`${payload}`)),
      takeUntil(this.dispose$),
    )
  }

  @Effect()
  asyncAddCountString(payload$: Observable<string>): Observable<Action> {
    return payload$.pipe(
      delay(TIME_TO_DELAY),
      map((payload) => this.getActions().setCount(parseInt(payload))),
      takeUntil(this.getAction$().asyncAddCount),
    )
  }

  @Effect()
  asyncAddCountOne(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      delay(TIME_TO_DELAY),
      withLatestFrom(this.state$),
      map(([, state]) => this.getActions().setCount(state.count + 1)),
    )
  }

  @Effect()
  effectWithPureSideEffect(payload$: Observable<void>) {
    return payload$.pipe(
      tap(noop),
      map(() => this.noop()),
    )
  }

  @Effect()
  effectToResetState(payload$: Observable<void>) {
    return payload$.pipe(map(() => this.reset()))
  }
}

describe('EffectModule Class', () => {
  let counter: Counter
  let store: IStore<CounterState>

  beforeEach(() => {
    counter = rootInjector.resolveAndInstantiate(Counter)
    store = counter.setupStore()
  })

  afterEach(() => {
    store.dispose()
  })

  describe('basic shape specs', () => {
    it('should dispatch reducer action', () => {
      expect(counter.getActions().setCount(1)).toStrictEqual({
        payload: 1,
        type: 'setCount',
        store,
      })
    })

    it('should dispatch effect action', () => {
      expect(counter.getActions().asyncAddCount(1)).toStrictEqual({
        payload: 1,
        type: 'asyncAddCount',
        store,
      })
    })

    it('should dispatch immer reducer action', () => {
      const payload = new Date()
      expect(counter.getActions().setCountImmer(payload)).toStrictEqual({
        payload,
        type: 'setCountImmer',
        store,
      })
    })

    it('should dispatch reducer action with void payload', () => {
      expect(counter.getActions().addOne()).toStrictEqual({
        payload: undefined,
        type: 'addOne',
        store,
      })
    })

    it('should dispatch effect action with void payload', () => {
      expect(counter.getActions().asyncAddCountOne()).toStrictEqual({
        payload: undefined,
        type: 'asyncAddCountOne',
        store,
      })
    })

    it('should dispatch immer reducer action with void payload', () => {
      expect(counter.getActions().addCountOneImmer()).toStrictEqual({
        payload: undefined,
        type: 'addCountOneImmer',
        store,
      })
    })

    it('should dispatch action created by DefineAction', () => {
      expect(counter.getActions().dispose$()).toStrictEqual({
        payload: undefined,
        type: 'dispose$',
        store,
      })
    })
  })

  describe('complex shape specs', () => {
    it('should be able to create module with without epic', () => {
      @Module('WithoutEpic')
      class WithoutEpic extends EffectModule<CounterState> {
        defaultState = {
          count: 0,
        }

        @Reducer()
        set(state: CounterState, payload: number) {
          return { ...state, count: payload }
        }
      }

      const onlyReducer = new WithoutEpic()
      const store = onlyReducer.setupStore()
      const actionCreator = onlyReducer.getActions()
      store.dispatch(actionCreator.set(1))
      expect(store.state.count).toBe(1)
    })

    it('should be able to create module without reducer', () => {
      @Module('WithoutReducer')
      class WithoutReducer extends EffectModule<CounterState> {
        defaultState = {
          count: 0,
        }

        @Effect()
        set(payload$: Observable<number>) {
          return payload$.pipe(
            tap(noop),
            map(() => this.noop()),
          )
        }
      }

      const withoutReducer = new WithoutReducer()
      const store = withoutReducer.setupStore()
      const actions = withoutReducer.getActions()
      store.dispatch(actions.set(1))
      expect(withoutReducer.state.count).toBe(withoutReducer.defaultState.count)
    })

    it('should throw if module name conflict#1', () => {
      const fn = () => {
        @Module('Module')
        class Module1 extends EffectModule<object> {
          defaultState = {}
        }

        @Module('Module')
        class Module2 extends EffectModule<object> {
          defaultState = {}
        }

        return { Module1, Module2 }
      }

      expect(fn).toThrow()
    })

    it('should throw if module name conflict#2', () => {
      const fn = () => {
        @Module('Module1')
        class Module1 extends EffectModule<object> {
          defaultState = {}
        }

        @Module('Module1')
        class Module2 extends EffectModule<object> {
          defaultState = {}
        }

        return { Module1, Module2 }
      }

      expect(fn).toThrow()
    })

    it('should throw if config in module invalid', () => {
      const fn = () => {
        @Module({} as any)
        class Module1 extends EffectModule<object> {
          defaultState = {}
        }

        return Module1
      }

      expect(fn).toThrow()
    })
  })

  describe('dispatcher', () => {
    let actionsDispatcher: InstanceActionOfEffectModule<Counter, CounterState>
    let spy: Sinon.SinonSpy
    let timer: Sinon.SinonFakeTimers
    beforeEach(() => {
      const actions = counter.getActions()
      actionsDispatcher = Object.keys(actions).reduce((acc, key) => {
        acc[key] = (p: any) => {
          const action = (actions as any)[key](p)
          store.dispatch(action)
          return action
        }
        return acc
      }, {} as any)
      spy = Sinon.spy()
      store.addEpic((action$) => {
        return action$.pipe(tap(spy))
      }, true)
      timer = Sinon.useFakeTimers()
    })

    afterEach(() => {
      spy.resetHistory()
      timer.restore()
    })

    it('should be able to dispatch reducer action by actions dispatcher #void', () => {
      const action = actionsDispatcher.addOne()
      expect(spy.alwaysCalledWith(action)).toBe(true)
      expect(spy.callCount).toBe(1)
      expect(store.state.count).toBe(counter.defaultState.count + 1)
    })

    it('should be able to dispatch reducer action by actions dispatcher #param', () => {
      const newCount = 100
      const action = actionsDispatcher.setCount(newCount)
      const [[arg]] = spy.args
      expect(arg).toStrictEqual(action)
      expect(spy.callCount).toBe(1)
      expect(store.state.count).toBe(newCount)
    })

    it('should be able to dispatch immer reducer action by actions dispatcher #void', () => {
      const action = actionsDispatcher.addCountOneImmer()
      const [[arg]] = spy.args
      expect(arg).toStrictEqual(action)
      expect(spy.callCount).toBe(1)
      expect(store.state.count).toBe(counter.defaultState.count + 1)
    })

    it('should be able to dispatch immer reducer action by actions dispatcher #param', () => {
      const newCount = new Date()
      const action = actionsDispatcher.setCountImmer(newCount)
      const [[arg]] = spy.args
      expect(arg).toStrictEqual(action)
      expect(spy.callCount).toBe(1)
      expect(store.state.count).toBe(newCount.valueOf())
    })

    it('should be able to dispatch epic action by actions dispatcher #void', () => {
      const action = actionsDispatcher.asyncAddCountOne()
      const [[arg]] = spy.args
      expect(arg).toStrictEqual(action)
      expect(spy.callCount).toBe(1)
      expect(store.state.count).toBe(counter.defaultState.count)
      timer.tick(TIME_TO_DELAY)
      const [, [arg1]] = spy.args
      expect(arg1).toStrictEqual(counter.getActions().setCount(counter.defaultState.count + 1))
      expect(spy.callCount).toBe(2)
    })

    it('should be able to dispatch epic action by actions dispatcher #param', () => {
      const newCount = 100
      const action = actionsDispatcher.asyncAddCount(newCount)
      const [[arg]] = spy.args
      expect(arg).toStrictEqual(action)
      expect(spy.callCount).toBe(1)
      expect(store.state.count).toBe(counter.defaultState.count)
      timer.tick(TIME_TO_DELAY)
      const [, [arg1]] = spy.args
      expect(arg1).toStrictEqual(counter.getActions().asyncAddCountString(`${newCount}`))
      expect(spy.callCount).toBe(2)
    })

    it('should be able to dispose by other actions', () => {
      const newCount = 100
      actionsDispatcher.asyncAddCount(newCount)
      expect(spy.callCount).toBe(1)
      actionsDispatcher.dispose$()
      timer.tick(TIME_TO_DELAY)
      expect(spy.callCount).toBe(2)
      expect(store.state).toStrictEqual(counter.defaultState)
    })

    it('should be able to dispatch noop action', () => {
      const action = actionsDispatcher.effectWithPureSideEffect()
      expect(spy.callCount).toBe(1)
      const [[arg1]] = spy.args
      expect(arg1).toStrictEqual(action)
      expect(store.state).toStrictEqual(counter.defaultState)
    })

    it('should be able to dispatch reset action', () => {
      actionsDispatcher.addOne()
      expect(store.state.count).toBe(counter.defaultState.count + 1)
      actionsDispatcher.effectToResetState()
      expect(spy.callCount).toBe(3)
      expect(store.state.count).toBe(counter.defaultState.count)
    })
  })
})
