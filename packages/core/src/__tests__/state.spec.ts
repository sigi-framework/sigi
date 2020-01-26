import { Reducer } from 'react'
import { identity } from 'rxjs'
import { filter, map, delay } from 'rxjs/operators'
import * as Sinon from 'sinon'
import { Action, Epic, StateCreator, State } from '@sigi/types'

import { createState } from '../state'

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

  let state: State<StateProps>

  const mockEpic: Epic<unknown> = (action$) =>
    action$.pipe(
      filter(({ type }) => type === ASYNC_UPDATE_FOO),
      map(() => ({ type: 'noop', payload: null, state })),
    )

  describe('stateCreator', () => {
    const defaultState = {
      foo: '1',
      bar: null,
    }
    const { stateCreator } = createState<StateProps>(mockReducer, identity)
    it('should be able to create state', () => {
      expect(stateCreator(defaultState).getState()).toBe(defaultState)
    })

    it('should be able to create state with new defaultState', () => {
      const newDefaultState = { ...defaultState }
      expect(stateCreator(newDefaultState).getState()).toBe(newDefaultState)
    })
  })

  describe('state', () => {
    const defaultState = {
      foo: '1',
      bar: null,
    }
    it('should be able to change state via dispatch action', () => {
      const { stateCreator } = createState(mockReducer, mockEpic)

      const state = stateCreator(defaultState)
      state.dispatch({ type: UPDATE_FOO, payload: '2', state })
      expect(state.getState().foo).toBe('2')
    })

    it('should do nothing when action type is not matched any reducer', () => {
      const { stateCreator } = createState<StateProps>(mockReducer, mockEpic)

      const state = stateCreator(defaultState)
      state.dispatch({ type: '__NOOP__', payload: '2', state })
      expect(state.getState().foo).toBe(defaultState.foo)
    })

    it('should run epic', () => {
      const { stateCreator } = createState(mockReducer, mockEpic)

      const state = stateCreator(defaultState)
      state.dispatch({ type: UPDATE_FOO, payload: '2', state })
      expect(state.getState().foo).toBe('2')
    })

    describe('effect', () => {
      let stateCreator: StateCreator<StateProps>
      let timer: Sinon.SinonFakeTimers
      const bar = 100

      const delayTime = 300

      beforeEach(() => {
        const { stateCreator: _stateCreator } = createState<StateProps>(mockReducer, (action$) =>
          action$.pipe(
            filter(({ type }) => type === ASYNC_UPDATE_BAR),
            delay(delayTime),
            map(() => ({
              type: UPDATE_BAR,
              payload: bar,
              state,
            })),
          ),
        )

        stateCreator = _stateCreator

        timer = Sinon.useFakeTimers()
      })

      afterEach(() => {
        timer.restore()
      })

      it('should be able to change state by effect', () => {
        state = stateCreator(defaultState)
        state.dispatch({
          type: ASYNC_UPDATE_BAR,
          payload: null,
          state,
        })
        timer.tick(delayTime)
        expect(state.getState().bar).toBe(bar)
      })
    })
  })
})
