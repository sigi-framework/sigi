import { Action, Epic, StoreCreator, Store } from '@sigi/types'
import { Reducer } from 'react'
import { identity } from 'rxjs'
import { filter, map, delay } from 'rxjs/operators'
import * as Sinon from 'sinon'

import { createStore } from '../state'

interface StateProps {
  foo: string
  bar: number | null
}

describe('state specs', () => {
  const UPDATE_FOO = 'update-foo'
  const UPDATE_BAR = 'update-bar'
  const ASYNC_UPDATE_FOO = 'async-update-foo'
  const ASYNC_UPDATE_BAR = 'async-update-bar'

  const mockReducer: Reducer<StateProps, Action<unknown>> = (prevState, action) => {
    if (action.type === UPDATE_FOO) {
      return { ...prevState, foo: action.payload as string }
    } else if (action.type === UPDATE_BAR) {
      return { ...prevState, bar: action.payload as number | null }
    }
    return prevState
  }

  let store: Store<StateProps>

  const mockEpic: Epic<unknown> = (action$) =>
    action$.pipe(
      filter(({ type }) => type === ASYNC_UPDATE_FOO),
      map(() => ({ type: 'noop', payload: null, state: store })),
    )

  describe('StoreCreator', () => {
    const defaultState = {
      foo: '1',
      bar: null,
    }
    const { setup } = createStore<StateProps>(mockReducer, identity)
    it('should be able to create state', () => {
      expect(setup(defaultState).getState()).toBe(defaultState)
    })

    it('should be able to create state with new defaultState', () => {
      const newDefaultState = { ...defaultState }
      expect(setup(newDefaultState).getState()).toBe(newDefaultState)
    })
  })

  describe('state', () => {
    const defaultState = {
      foo: '1',
      bar: null,
    }
    it('should be able to change state via dispatch action', () => {
      const { setup } = createStore(mockReducer, mockEpic)

      const store = setup(defaultState)
      store.dispatch({ type: UPDATE_FOO, payload: '2', store })
      expect(store.getState().foo).toBe('2')
    })

    it('should do nothing when action type is not matched any reducer', () => {
      const { setup } = createStore<StateProps>(mockReducer, mockEpic)

      const store = setup(defaultState)
      store.dispatch({ type: '__NOOP__', payload: '2', store })
      expect(store.getState().foo).toBe(defaultState.foo)
    })

    it('should run epic', () => {
      const { setup } = createStore(mockReducer, mockEpic)

      const store = setup(defaultState)
      store.dispatch({ type: UPDATE_FOO, payload: '2', store })
      expect(store.getState().foo).toBe('2')
    })

    describe('effect', () => {
      let setup: StoreCreator<StateProps>
      let timer: Sinon.SinonFakeTimers
      const bar = 100

      const delayTime = 300

      beforeEach(() => {
        const { setup: _setup } = createStore<StateProps>(mockReducer, (action$) =>
          action$.pipe(
            filter(({ type }) => type === ASYNC_UPDATE_BAR),
            delay(delayTime),
            map(() => ({
              type: UPDATE_BAR,
              payload: bar,
              store,
            })),
          ),
        )

        setup = _setup

        timer = Sinon.useFakeTimers()
      })

      afterEach(() => {
        timer.restore()
      })

      it('should be able to change state by effect', () => {
        store = setup(defaultState)
        store.dispatch({
          type: ASYNC_UPDATE_BAR,
          payload: null,
          store,
        })
        timer.tick(delayTime)
        expect(store.getState().bar).toBe(bar)
      })
    })
  })
})
