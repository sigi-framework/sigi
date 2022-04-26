import { Action, Epic } from '@sigi/types'
import { Reducer } from 'react'
import { interval } from 'rxjs'
import { delay, filter, map, mapTo, mergeMap, tap } from 'rxjs/operators'
import * as Sinon from 'sinon'

import { Store } from '../store'

interface State {
  foo: string
  bar: number | null
}

const delayTime = 300

describe('store specs', () => {
  const UPDATE_FOO = 'update-foo'
  const UPDATE_BAR = 'update-bar'
  const ASYNC_UPDATE_FOO = 'async-update-foo'
  let timer: Sinon.SinonFakeTimers

  const mockReducer: Reducer<State, Action<any>> = (prevState, action) => {
    if (action.type === UPDATE_FOO) {
      return { ...prevState, foo: action.payload }
    } else if (action.type === UPDATE_BAR) {
      return { ...prevState, bar: action.payload }
    }
    return prevState
  }

  let store: Store<State>

  const mockEpic: Epic = (action$) =>
    action$.pipe(
      filter(({ type }) => type === ASYNC_UPDATE_FOO),
      delay(delayTime),
      map(({ payload }) => ({ type: UPDATE_FOO, payload, store })),
    )

  const defaultState = {
    foo: '1',
    bar: null,
  }

  beforeEach(() => {
    store = new Store('testStore', mockReducer, mockEpic)
    store.setup(defaultState)
    timer = Sinon.useFakeTimers()
  })

  afterEach(() => {
    store.dispose()
    timer.restore()
  })

  describe('state', () => {
    it('should be able to create state', () => {
      expect(store.state).toBe(defaultState)
    })
  })

  describe('dispatch', () => {
    it('should be able to change state via dispatch action', () => {
      store.dispatch({ type: UPDATE_FOO, payload: '2', store })
      expect(store.state.foo).toBe('2')
    })

    it('should do nothing when action type is not matched any reducer', () => {
      store.dispatch({ type: '__NOOP__', payload: '2', store })
      expect(store.state.foo).toBe(defaultState.foo)
    })

    it('should run epic', () => {
      store.dispatch({ type: ASYNC_UPDATE_FOO, payload: '2', store })
      expect(store.state.foo).toBe(defaultState.foo)
      timer.tick(delayTime)
      expect(store.state.foo).toBe('2')
    })

    it("should be able to dispatch other store's action", () => {
      const otherStore = new Store<State>('otherStore', mockReducer)
      otherStore.setup(defaultState)
      expect(store.state.foo).toBe(defaultState.foo)
      otherStore.dispatch({
        type: UPDATE_FOO,
        payload: '2',
        store,
      })
      expect(store.state.foo).toBe('2')
    })

    it('should be able to add epic after setup', () => {
      const spy = Sinon.spy()
      store.addEpic((prev) => (action$) => action$.pipe(tap(spy), prev))
      const action = { type: '__NOOP__', payload: null, store }
      store.dispatch(action)
      expect(spy.callCount).toBe(1)
      const [[arg]] = spy.args
      expect(arg).toStrictEqual(action)
    })

    it('should respect epics ordering', () => {
      const spy = Sinon.spy()
      store.addEpic((prev) => (action$) => action$.pipe(prev, tap(spy)))

      store.dispatch({ type: UPDATE_FOO, payload: '2', store })
      expect(spy.callCount).toBe(0)
    })
  })

  describe('Dispose', () => {
    it('should complete all pending epic after disposed', () => {
      const nextSpy = Sinon.spy()
      const store = new Store('testStore', mockReducer, (action$) =>
        action$.pipe(
          mergeMap((action) => interval(1000).pipe(mapTo(action))),
          tap({
            next: nextSpy,
          }),
        ),
      )
      store.setup(defaultState)

      store.dispatch({ type: UPDATE_FOO, payload: '2', store })
      timer.tick(1000)
      expect(nextSpy.callCount).toBe(1)
      store.dispose()
      timer.tick(1000)
      expect(nextSpy.callCount).toBe(1)
    })

    it('should complete all pending epic after disposed on added epic', () => {
      const nextSpy = Sinon.spy()
      const store = new Store('testStore', mockReducer)
      store.setup(defaultState)

      store.addEpic(
        // eslint-disable-next-line sonarjs/no-identical-functions
        () => (action$) =>
          action$.pipe(
            mergeMap((action) => interval(1000).pipe(mapTo(action))),
            tap({
              next: nextSpy,
            }),
          ),
      )

      store.dispatch({ type: UPDATE_FOO, payload: '2', store })
      timer.tick(1000)
      expect(nextSpy.callCount).toBe(1)
      store.dispose()
      timer.tick(1000)
      expect(nextSpy.callCount).toBe(1)
    })
  })
})
