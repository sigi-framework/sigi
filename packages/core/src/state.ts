import { Observable, Subject, noop, ReplaySubject, Subscription, identity } from 'rxjs'
import { Reducer } from 'react'
import { Store, Epic, StoreCreator, Action } from '@sigi/types'

import { TERMINATE_ACTION } from './constants'
import { logStoreAction } from './logger'
import { StoreInterface } from './symbols'
import { StoreAction } from './types'

export function createStore<S>(
  reducer: Reducer<S, Action<unknown>>,
  effect: Epic<unknown>,
): {
  setup: StoreCreator<S>
  action$: Observable<Action<unknown>>
  state$: ReplaySubject<S>
} {
  const action$ = new Subject<Action<unknown>>()
  const effect$ = new Subject<Action<unknown>>()
  const actionObservers = new Set<(action: Action<unknown>) => void>()
  const state$ = new ReplaySubject<S>(1)

  const setup: StoreCreator<S> = (defaultState, middleware = identity, loadFromSSR = false) => {
    const store: Store<S> = Object.create(null)
    let appState = defaultState

    function dispatch<T>(action: StoreAction<T>) {
      if (action.store && action.store !== store && action.type !== TERMINATE_ACTION.type) {
        action.store.dispatch(action)
        return
      }
      const prevState: S = appState
      const newState = reducer(prevState, action)
      if (newState !== prevState) {
        state$.next(newState)
      }
      logStoreAction(action)
      action$.next(action)
      effect$.next(action)
    }

    const effectAction$: Observable<Action<unknown>> = effect(effect$, loadFromSSR)

    const subscription = new Subscription()

    subscription.add(
      middleware(effectAction$).subscribe(
        (action) => {
          try {
            dispatch(action as StoreAction)
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
          effect$.error(err)
        },
        () => {
          effect$.complete()
        },
      ),
    )

    subscription.add(
      state$.subscribe((state) => {
        appState = state
      }),
    )

    state$.next(defaultState)

    Object.assign(store, {
      [StoreInterface]: store,
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
        store.dispatch = noop
        actionObservers.clear()
      },
    })
    return store
  }
  return { setup, action$, state$ }
}
