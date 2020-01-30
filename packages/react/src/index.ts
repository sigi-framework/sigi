import React, { useContext, useMemo, useEffect } from 'react'
import { useInstance } from '@sigi/di'
import { Ayanami, ActionOfAyanami, SSR_LOADED_KEY } from '@sigi/core'
import { ConstructorOf, State } from '@sigi/types'
import { SSRStateCacheInstance, oneShotCache } from '@sigi/ssr'
import produce, { Draft } from 'immer'
import { map, distinctUntilChanged, skip } from 'rxjs/operators'

import { SSRSharedContext, SSRContext } from './ssr-context'

export type StateSelector<S, U> = {
  (state: S): U
}

export type StateSelectorConfig<S, U> = {
  selector?: StateSelector<S, U>
  mutateStateOnFirstRendering?: (s: Draft<S>) => void
}

function _useAyanamiDispatchers<M extends Ayanami<S>, S = any>(ayanami: M) {
  return useMemo(() => {
    const state = ayanami.state!
    const actionsCreator = ayanami.getActions()
    return Object.keys(actionsCreator).reduce((acc, cur) => {
      acc[cur] = (payload: any) => {
        const action = (actionsCreator as any)[cur](payload)
        state.dispatch(action)
      }
      return acc
    }, Object.create(null))
  }, [ayanami])
}

export function useAyanamiDispatchers<M extends Ayanami<S>, S = any>(A: ConstructorOf<M>): ActionOfAyanami<M, S> {
  const { ayanami } = _useState(A)
  return _useAyanamiDispatchers(ayanami)
}

function _useAyanamiState<S, U = S>(
  state: State<S>,
  selector?: StateSelector<S, U>,
  mutateStateOnFirstRendering?: (s: Draft<S>) => void,
): S | U {
  const [appState, setState] = React.useState(() => {
    let initialState = state.getState()
    if (typeof mutateStateOnFirstRendering === 'function') {
      initialState = produce(initialState, mutateStateOnFirstRendering)
      state.state$.next(initialState)
    }
    return selector && !Reflect.getMetadata(SSR_LOADED_KEY, state) ? selector(initialState) : initialState
  })

  // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
  // do not put subscribe in useEffect

  const subscription = useMemo(() => {
    return state.state$
      .pipe(
        skip(1),
        map((s) => {
          if (Reflect.getMetadata(SSR_LOADED_KEY, state)) {
            Reflect.deleteMetadata(SSR_LOADED_KEY, state)
            return s
          } else {
            return selector ? selector(s) : s
          }
        }),
        distinctUntilChanged(),
      )
      .subscribe(setState)
  }, [state, selector])

  useEffect(() => () => subscription.unsubscribe(), [state, subscription])

  return appState
}

export function useAyanamiState<M extends Ayanami<any>>(
  A: ConstructorOf<M>,
): M extends Ayanami<infer State> ? State : never

export function useAyanamiState<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config: M extends Ayanami<infer State>
    ? {
        mutateStateOnFirstRendering?: (s: Draft<State>) => void
        selector: StateSelector<State, U>
      }
    : never,
): M extends Ayanami<infer State>
  ? typeof config['selector'] extends StateSelector<State, infer NewState>
    ? NewState
    : never
  : never

export function useAyanamiState<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config: M extends Ayanami<infer State>
    ? {
        mutateStateOnFirstRendering: (s: Draft<State>) => void
      }
    : never,
): M extends Ayanami<infer State> ? State : never

export function useAyanamiState<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config?: M extends Ayanami<infer S> ? StateSelectorConfig<S, U> : never,
) {
  const { state } = _useState(A)
  return _useAyanamiState(state, config?.selector, config?.mutateStateOnFirstRendering)
}

export function useAyanami<M extends Ayanami<any>>(
  A: ConstructorOf<M>,
): M extends Ayanami<infer State> ? [State, ActionOfAyanami<M, State>] : never

export function useAyanami<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config: M extends Ayanami<infer State>
    ? {
        selector: StateSelector<State, U>
        mutateStateOnFirstRendering?: (s: Draft<State>) => void
      }
    : never,
): M extends Ayanami<infer State>
  ? typeof config['selector'] extends StateSelector<State, infer NewState>
    ? [NewState, ActionOfAyanami<M, State>]
    : never
  : never

export function useAyanami<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config: M extends Ayanami<infer State>
    ? {
        mutateStateOnFirstRendering: (s: Draft<State>) => void
      }
    : never,
): M extends Ayanami<infer State> ? [State, ActionOfAyanami<M, State>] : never

export function useAyanami<M extends Ayanami<S>, U, S>(A: ConstructorOf<M>, config?: StateSelectorConfig<S, U>) {
  const { ayanami, state } = _useState(A)
  const appState = _useAyanamiState(state, config?.selector, config?.mutateStateOnFirstRendering)
  const appDispatcher = _useAyanamiDispatchers(ayanami)

  return [appState, appDispatcher]
}

function _useState<M extends Ayanami<S>, S = any>(A: ConstructorOf<M>): { ayanami: M; state: State<S> } {
  const ssrSharedContext = useContext(SSRSharedContext)
  const ssrContext = useContext(SSRContext)
  const ayanami = useInstance(A)
  const state = useMemo(() => {
    return SSRStateCacheInstance.has(ssrSharedContext, A)
      ? SSRStateCacheInstance.get(ssrSharedContext, A)!
      : ssrContext
      ? oneShotCache.consume(ssrContext, A) ?? ayanami.createState()
      : ayanami.createState()
  }, [ayanami, ssrContext, ssrSharedContext, A])

  return { ayanami, state }
}

export { SSRContext, SSRSharedContext } from './ssr-context'
