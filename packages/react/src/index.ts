import { EffectModule, ActionOfEffectModule } from '@sigi/core'
import { SSRStateCacheInstance, oneShotCache } from '@sigi/ssr'
import { ConstructorOf, IStore } from '@sigi/types'
import React, { useContext, useMemo, useEffect, useRef } from 'react'
import { map, distinctUntilChanged, skip } from 'rxjs/operators'

import { useInstance } from './injectable-context'
import { SSRSharedContext, SSRContext } from './ssr-context'

export type StateSelector<S, U> = {
  (state: S): U
}

export type StateSelectorConfig<S, U> = {
  selector: StateSelector<S, U>
  dependencies: any[]
}

function _useDispatchers<M extends EffectModule<S>, S = any>(effectModule: M) {
  return useMemo(() => {
    const store: IStore<S> = (effectModule as any).store!
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

function _useModuleState<S, U = S>(store: IStore<S>, selector?: StateSelector<S, U>, dependencies?: any[]): S | U {
  const [appState, setState] = React.useState(() => {
    const initialState = store.state
    return selector ? selector(initialState) : initialState
  })

  const isFirstRendering = useRef(true)

  if (process.env.NODE_ENV === 'development' && selector && !dependencies) {
    console.warn('You pass a selector but no dependencies with it, the selector will be treated as immutable')
  }

  // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
  // do not put subscribe in useEffect
  const subscription = useMemo(() => {
    return store.state$
      .pipe(
        // skip initial state emission
        skip(isFirstRendering.current ? 1 : 0),
        map((s) => (selector ? selector(s) : s)),
        distinctUntilChanged(),
      )
      .subscribe(setState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, ...(dependencies ?? [])])

  useEffect(() => {
    isFirstRendering.current = false
    return () => {
      subscription.unsubscribe()
    }
  }, [store, subscription])

  return appState
}

export function useModuleState<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? State : never

export function useModuleState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State>
    ? {
        selector: StateSelector<State, U>
        dependencies: any[]
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
  return _useModuleState(store, config?.selector, config?.dependencies)
}

export function useModule<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? [State, ActionOfEffectModule<M, State>] : never

export function useModule<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State>
    ? {
        selector: StateSelector<State, U>
        dependencies: any[]
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
  const appState = _useModuleState(store, config?.selector, config?.dependencies)
  const appDispatcher = _useDispatchers(effectModule)

  return [appState, appDispatcher]
}

function _useModule<M extends EffectModule<S>, S = any>(A: ConstructorOf<M>): { effectModule: M; store: IStore<S> } {
  const ssrSharedContext = useContext(SSRSharedContext)
  const ssrContext = useContext(SSRContext)
  const effectModule = useInstance(A)
  const store = useMemo(() => {
    return SSRStateCacheInstance.has(ssrSharedContext, A)
      ? SSRStateCacheInstance.get(ssrSharedContext, A)!
      : ssrContext
      ? oneShotCache.consume(ssrContext, A) ?? effectModule.setupStore()
      : effectModule.setupStore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssrContext, ssrSharedContext, A, effectModule, oneShotCache])

  return { effectModule, store }
}

export { SSRContext, SSRSharedContext } from './ssr-context'
export * from './injectable-context'
