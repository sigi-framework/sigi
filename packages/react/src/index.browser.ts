/// <reference types="react/next" />
import { EffectModule, ActionOfEffectModule } from '@sigi/core'
import { ConstructorOf, IStore } from '@sigi/types'
import { useDebugValue } from 'react'
import { identity, skip } from 'rxjs'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector'

import { useInstance } from './injectable-context'
import { shallowEqual } from './shallow-equal'

export type StateSelector<S, U = S> = {
  (state: S): U
}

export type StateSelectorConfig<S, U = S> = {
  selector: (state: S) => U
  equalFn?: (u1: U, u2: U) => boolean
  // use never to tell user that it is not required any more
  dependencies?: never
}

export function useDispatchers<M extends EffectModule<S>, S = any>(A: ConstructorOf<M>): ActionOfEffectModule<M, S> {
  const effectModule = useInstance(A)
  return effectModule.dispatchers
}

function _useModuleState<S, U = S>(
  store: IStore<S>,
  // @ts-expect-error valid assignment
  selector: StateSelectorConfig<S, U>['selector'] = identity,
  equalFn = shallowEqual,
): S | U {
  const state = useSyncExternalStoreWithSelector(
    (onStoreChange) => {
      const sub = store.state$.pipe(skip(1)).subscribe(onStoreChange)
      return () => sub.unsubscribe()
    },
    () => store.state,
    () => store.state,
    selector,
    equalFn,
  )

  useDebugValue(state)

  return state
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
  return _useModuleState(store, config?.selector, config?.equalFn)
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
  const appState = _useModuleState(store, config?.selector)
  const appDispatcher = effectModule.dispatchers

  return [appState, appDispatcher]
}

export { SSRContext } from './ssr-context'
export * from './injectable-context'
