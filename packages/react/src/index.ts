import React, { useContext, useMemo, useEffect } from 'react'
import { EffectModule, ActionOfEffectModule, SSR_LOADED_KEY } from '@sigi/core'
import { ConstructorOf, Store } from '@sigi/types'
import { SSRStateCacheInstance, oneShotCache } from '@sigi/ssr'
import { Draft } from 'immer'
import { Subject } from 'rxjs'
import { map, distinctUntilChanged, skip } from 'rxjs/operators'

import { SSRSharedContext, SSRContext } from './ssr-context'
import { useInstance } from './injectable-context'

export type StateSelector<S, U> = {
  (state: S): U
}

export type StateSelectorConfig<S, U> = {
  selector?: StateSelector<S, U>
}

function _useDispatchers<M extends EffectModule<S>, S = any>(effectModule: M) {
  return useMemo(() => {
    const store: Store<S> = (effectModule as any).store!
    const actionsCreator = effectModule.getActions()
    return Object.keys(actionsCreator).reduce((acc, cur) => {
      acc[cur] = (payload: any) => {
        const action = (actionsCreator as any)[cur](payload)
        store.dispatch(action)
      }
      return acc
    }, Object.create(null))
  }, [effectModule])
}

export function useDispatchers<M extends EffectModule<S>, S = any>(A: ConstructorOf<M>): ActionOfEffectModule<M, S> {
  const { effectModule } = _useModule(A)
  return _useDispatchers(effectModule)
}

function _useModuleState<S, U = S>(store: Store<S>, selector?: StateSelector<S, U>): S | U {
  const [appState, setState] = React.useState(() => {
    const initialState = store.getState()
    return selector && !Reflect.getMetadata(SSR_LOADED_KEY, store) ? selector(initialState) : initialState
  })

  // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
  // do not put subscribe in useEffect

  const subscription = useMemo(() => {
    return ((store as any).state$ as Subject<S>)
      .pipe(
        skip(1),
        map((s) => {
          if (Reflect.getMetadata(SSR_LOADED_KEY, store)) {
            Reflect.deleteMetadata(SSR_LOADED_KEY, store)
            return s
          } else {
            return selector ? selector(s) : s
          }
        }),
        distinctUntilChanged(),
      )
      .subscribe(setState)
  }, [store, selector])

  useEffect(() => () => subscription.unsubscribe(), [store, subscription])

  return appState
}

export function useModuleState<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? State : never

export function useModuleState<M extends EffectModule<any>, U>(
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

export function useModuleState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? State : never

export function useModuleState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config?: M extends EffectModule<infer S> ? StateSelectorConfig<S, U> : never,
) {
  const { store } = _useModule(A)
  return _useModuleState(store, config?.selector)
}

export function useModule<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? [State, ActionOfEffectModule<M, State>] : never

export function useModule<M extends EffectModule<any>, U>(
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

export function useModule<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? [State, ActionOfEffectModule<M, State>] : never

export function useModule<M extends EffectModule<S>, U, S>(A: ConstructorOf<M>, config?: StateSelectorConfig<S, U>) {
  const { effectModule, store } = _useModule(A)
  const appState = _useModuleState(store, config?.selector)
  const appDispatcher = _useDispatchers(effectModule)

  return [appState, appDispatcher]
}

function _useModule<M extends EffectModule<S>, S = any>(A: ConstructorOf<M>): { effectModule: M; store: Store<S> } {
  const ssrSharedContext = useContext(SSRSharedContext)
  const ssrContext = useContext(SSRContext)
  const effectModule = useInstance(A)
  const store = useMemo(() => {
    return SSRStateCacheInstance.has(ssrSharedContext, A)
      ? SSRStateCacheInstance.get(ssrSharedContext, A)!
      : ssrContext
      ? oneShotCache.consume(ssrContext, A) ?? effectModule.createStore()
      : effectModule.createStore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssrContext, ssrSharedContext, A])

  return { effectModule, store }
}

export { SSRContext, SSRSharedContext } from './ssr-context'
export * from './injectable-context'
