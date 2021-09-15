import { EffectModule, ActionOfEffectModule } from '@sigi/core'
import { ConstructorOf, IStore } from '@sigi/types'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { identity } from 'rxjs'
import { distinctUntilChanged, skip } from 'rxjs/operators'

import { useInstance } from './injectable-context'
import { shallowEqual } from './shallow-equal'

export type StateSelector<S, U> = {
  (state: S): U
}

export type StateSelectorConfig<S, U> = {
  selector: StateSelector<S, U>
  dependencies: any[]
  equalFn?: (u1: U, u2: U) => boolean
}

export function useDispatchers<M extends EffectModule<S>, S = any>(A: ConstructorOf<M>): ActionOfEffectModule<M, S> {
  const effectModule = useInstance(A)
  return effectModule.dispatchers
}

function _useModuleState<S, U = S>(
  store: IStore<S>,
  selector?: StateSelector<S, U>,
  dependencies?: any[],
  equalFn = shallowEqual,
): S | U {
  if (process.env.NODE_ENV === 'development' && selector && !dependencies) {
    console.warn('You pass a selector but no dependencies with it, the selector will be treated as immutable')
  }
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  dependencies = dependencies || []
  const isFirstRendering = useRef(true)
  const [appState, setState] = useState(store.state)

  const cachedSelector = useCallback(
    (state: S) => {
      return selector ? selector(state) : identity(state)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...dependencies],
  )

  const subscribe = useCallback(() => {
    return store.state$
      .pipe(
        distinctUntilChanged((s1, s2) => equalFn(cachedSelector(s1), cachedSelector(s2))),
        // skip initial state emission and updated cachedSelector
        skip(1),
      )
      .subscribe(setState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, cachedSelector])

  const subscription = useMemo(() => {
    return subscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe])

  useEffect(() => {
    isFirstRendering.current = false
    const maybeReSubscribeInConcurrencyMode = subscription.closed ? subscribe() : subscription
    return () => {
      maybeReSubscribeInConcurrencyMode.unsubscribe()
    }
  }, [subscription, subscribe])

  return cachedSelector(appState)
}

export function useModuleState<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? State : never

export function useModuleState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State> ? StateSelectorConfig<State, U> : never,
): M extends EffectModule<infer State>
  ? typeof config['selector'] extends StateSelector<State, infer NewState>
    ? NewState
    : never
  : never

export function useModuleState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config?: M extends EffectModule<infer S> ? StateSelectorConfig<S, U> : never,
) {
  const { store } = useInstance(A)
  return _useModuleState(store, config?.selector, config?.dependencies, config?.equalFn)
}

export function useModule<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? [State, ActionOfEffectModule<M, State>] : never

export function useModule<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State> ? StateSelectorConfig<State, U> : never,
): M extends EffectModule<infer State>
  ? typeof config['selector'] extends StateSelector<State, infer NewState>
    ? [NewState, ActionOfEffectModule<M, State>]
    : never
  : never

export function useModule<M extends EffectModule<S>, U, S>(A: ConstructorOf<M>, config?: StateSelectorConfig<S, U>) {
  const effectModule = useInstance(A)
  const { store } = effectModule
  const appState = _useModuleState(store, config?.selector, config?.dependencies, config?.equalFn)
  const appDispatcher = effectModule.dispatchers

  return [appState, appDispatcher]
}

export { SSRContext } from './ssr-context'
export * from './injectable-context'
