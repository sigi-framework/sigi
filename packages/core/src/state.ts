import { Observable, Subject, noop, ReplaySubject, Subscription, identity } from 'rxjs'
import { Reducer } from 'react'
import { State, Epic, StateCreator, Action } from '@sigi/types'

import { TERMINATE_ACTION } from './constants'
import { logStateAction } from './logger'
import { StateInterface } from './symbols'
import { StateAction } from './types'

export function createState<S>(
  reducer: Reducer<S, Action<unknown>>,
  effect: Epic<unknown>,
): {
  stateCreator: StateCreator<S>
  action$: Observable<Action<unknown>>
  state$: ReplaySubject<S>
} {
  const action$ = new Subject<Action<unknown>>()
  const _action$ = new Subject<Action<unknown>>()
  const actionObservers = new Set<(action: Action<unknown>) => void>()
  const state$ = new ReplaySubject<S>(1)

  function stateCreator(
    defaultState: S,
    middleware: (effect$: Observable<Action<unknown>>) => Observable<Action<unknown>> = identity,
    loadFromSSR = false,
  ): State<S> {
    const state: State<S> = Object.create(null)
    let appState = defaultState

    function dispatch<T>(action: StateAction<T>) {
      if (action.state !== state && action.type !== TERMINATE_ACTION.type) {
        action.state.dispatch(action)
        return
      }
      const prevState: S = appState
      const newState = reducer(prevState, action)
      if (newState !== prevState) {
        state$.next(newState)
      }
      logStateAction(action)
      action$.next(action)
      _action$.next(action)
    }

    const effect$: Observable<Action<unknown>> = effect(_action$, loadFromSSR)

    const subscription = new Subscription()

    subscription.add(
      middleware(effect$).subscribe(
        (action) => {
          try {
            dispatch(action as StateAction)
          } catch (e) {
            action$.error(e)
          }
        },
        (err) => {
          console.error(err)
        },
      ),
    )

    subscription.add(
      action$.subscribe(
        (action) => {
          for (const observer of actionObservers) {
            observer(action)
          }
        },
        (err: any) => {
          _action$.error(err)
        },
        () => {
          _action$.complete()
        },
      ),
    )

    subscription.add(
      state$.subscribe((state) => {
        appState = state
      }),
    )

    state$.next(defaultState)

    Object.assign(state, {
      [StateInterface]: state,
      dispatch,
      state$,
      getState: () => appState,
      subscribeAction: (observer: (action: Action<unknown>) => void) => {
        actionObservers.add(observer)
        return () => actionObservers.delete(observer)
      },
      unsubscribe: () => {
        action$.complete()
        state$.complete()
        subscription.unsubscribe()
        state.dispatch = noop
        actionObservers.clear()
      },
    })
    return state
  }
  return { stateCreator, action$, state$ }
}
