import React, { useContext, useMemo, useEffect } from 'react'
import { EffectModule, ActionOfEffectModule, SSR_LOADED_KEY } from '@sigi/core'
import { ConstructorOf, State } from '@sigi/types'
import { SSRStateCacheInstance, oneShotCache } from '@sigi/ssr'
import produce, { Draft } from 'immer'
import { map, distinctUntilChanged, skip } from 'rxjs/operators'

import { SSRSharedContext, SSRContext } from './ssr-context'
import { useInstance } from './injectable-context'

export type StateSelector<S, U> = {
  (state: S): U
}

export type StateSelectorConfig<S, U> = {
  selector?: StateSelector<S, U>
  mutateStateOnFirstRendering?: (s: Draft<S>) => void
}

function _useEffectModuleDispatchers<M extends EffectModule<S>, S = any>(effectModule: M) {
  return useMemo(() => {
    const state = effectModule.state!
    const actionsCreator = effectModule.getActions()
    return Object.keys(actionsCreator).reduce((acc, cur) => {
      acc[cur] = (payload: any) => {
        const action = (actionsCreator as any)[cur](payload)
        state.dispatch(action)
      }
      return acc
    }, Object.create(null))
  }, [effectModule])
}

export function useEffectModuleDispatchers<M extends EffectModule<S>, S = any>(
  A: ConstructorOf<M>,
): ActionOfEffectModule<M, S> {
  const { effectModule } = _useState(A)
  return _useEffectModuleDispatchers(effectModule)
}

function _useEffectState<S, U = S>(
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

export function useEffectState<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? State : never

export function useEffectState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State>
    ? {
        mutateStateOnFirstRendering?: (s: Draft<State>) => void
        selector: StateSelector<State, U>
      }
    : never,
): M extends EffectModule<infer State>
  ? typeof config['selector'] extends StateSelector<State, infer NewState>
    ? NewState
    : never
  : never

export function useEffectState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State>
    ? {
        mutateStateOnFirstRendering: (s: Draft<State>) => void
      }
    : never,
): M extends EffectModule<infer State> ? State : never

export function useEffectState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config?: M extends EffectModule<infer S> ? StateSelectorConfig<S, U> : never,
) {
  const { state } = _useState(A)
  return _useEffectState(state, config?.selector, config?.mutateStateOnFirstRendering)
}

export function useEffectModule<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? [State, ActionOfEffectModule<M, State>] : never

export function useEffectModule<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State>
    ? {
        selector: StateSelector<State, U>
        mutateStateOnFirstRendering?: (s: Draft<State>) => void
      }
    : never,
): M extends EffectModule<infer State>
  ? typeof config['selector'] extends StateSelector<State, infer NewState>
    ? [NewState, ActionOfEffectModule<M, State>]
    : never
  : never

export function useEffectModule<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State>
    ? {
        mutateStateOnFirstRendering: (s: Draft<State>) => void
      }
    : never,
): M extends EffectModule<infer State> ? [State, ActionOfEffectModule<M, State>] : never

export function useEffectModule<M extends EffectModule<S>, U, S>(
  A: ConstructorOf<M>,
  config?: StateSelectorConfig<S, U>,
) {
  const { effectModule, state } = _useState(A)
  const appState = _useEffectState(state, config?.selector, config?.mutateStateOnFirstRendering)
  const appDispatcher = _useEffectModuleDispatchers(effectModule)

  return [appState, appDispatcher]
}

function _useState<M extends EffectModule<S>, S = any>(A: ConstructorOf<M>): { effectModule: M; state: State<S> } {
  const ssrSharedContext = useContext(SSRSharedContext)
  const ssrContext = useContext(SSRContext)
  const effectModule = useInstance(A)
  const state = useMemo(() => {
    return SSRStateCacheInstance.has(ssrSharedContext, A)
      ? SSRStateCacheInstance.get(ssrSharedContext, A)!
      : ssrContext
      ? oneShotCache.consume(ssrContext, A) ?? effectModule.createState()
      : effectModule.createState()
  }, [effectModule, ssrContext, ssrSharedContext, A])

  return { effectModule, state }
}

export { SSRContext, SSRSharedContext } from './ssr-context'
export * from './injectable-context'
