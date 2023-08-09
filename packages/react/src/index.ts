import { EffectModule, ActionOfEffectModule } from '@sigi/core'
import { ConstructorOf } from '@sigi/types'

import { useServerInstance } from './injectable-context'

export type StateSelector<S, U> = {
  (state: S): U
}

export type StateSelectorConfig<S, U> = {
  selector: StateSelector<S, U>
}

const SERVER_DISPATCHERS = new Proxy(Object.create(null), {
  apply() {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(new Error('Dispatch while calling react-dom/server functions is forbidden'))
    }
  },
})

export function useDispatchers<M extends EffectModule<S>, S = any>(_A: ConstructorOf<M>): ActionOfEffectModule<M, S> {
  return SERVER_DISPATCHERS
}

export function useModuleState<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? State : never

export function useModuleState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State> ? StateSelectorConfig<State, U> : never,
): M extends EffectModule<infer State>
  ? (typeof config)['selector'] extends StateSelector<State, infer NewState>
    ? NewState
    : never
  : never

export function useModuleState<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config?: M extends EffectModule<infer S> ? StateSelectorConfig<S, U> : never,
) {
  const { store } = useServerInstance(A)
  return typeof config?.selector === 'function' ? config.selector(store.state) : store.state
}

export function useModule<M extends EffectModule<any>>(
  A: ConstructorOf<M>,
): M extends EffectModule<infer State> ? [State, ActionOfEffectModule<M, State>] : never

export function useModule<M extends EffectModule<any>, U>(
  A: ConstructorOf<M>,
  config: M extends EffectModule<infer State> ? StateSelectorConfig<State, U> : never,
): M extends EffectModule<infer State>
  ? (typeof config)['selector'] extends StateSelector<State, infer NewState>
    ? [NewState, ActionOfEffectModule<M, State>]
    : never
  : never

export function useModule<M extends EffectModule<S>, U, S>(A: ConstructorOf<M>, config?: StateSelectorConfig<S, U>) {
  const effectModule = useServerInstance(A)
  const { store } = effectModule
  const appState = typeof config?.selector === 'function' ? config.selector(store.state) : store.state

  return [appState, SERVER_DISPATCHERS]
}

export { SSRContext } from './ssr-context'
export * from './injectable-context'
