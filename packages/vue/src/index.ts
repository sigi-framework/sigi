import { EffectModule, ActionOfEffectModule, StateInEffectModule } from '@sigi/core'
import { rootInjector } from '@sigi/di'
import { ConstructorOf, Store as PublicStore } from '@sigi/types'
import { Subject } from 'rxjs'
import Vue, { ComponentOptions, WatchOptionsWithHandler } from 'vue'
import { DefaultProps } from 'vue/types/options'

import { cloneDeepPoj } from './utils'

export type Prop<T> =
  | { (): T }
  | { new (...args: never[]): T & object }
  | { new (...args: string[]): (...args: any[]) => any }

export type PropType<T> = Prop<T> | Prop<T>[]

export type PropValidator<T> = PropOptions<T> | PropType<T>

interface Store<S = any> extends PublicStore<S> {
  state$: Subject<S>
}

export interface PropOptions<T = any> {
  type?: PropType<T>
  required?: boolean
  default?: T | null | undefined | (() => T | null | undefined)
  validator?: (value: T) => boolean
}

export type RecordPropsDefinition<T> = {
  [K in keyof T]: PropValidator<T[K]>
}
export type ArrayPropsDefinition<T> = (keyof T)[]
export type PropsDefinition<T> = ArrayPropsDefinition<T> | RecordPropsDefinition<T>

export type WatchHandler<T> = {
  (value: T, oldValue: T): void
}

export type ReactiveComponentOptions<
  M extends EffectModule<any>,
  V extends Vue,
  D,
  Methods,
  Computed,
  Props,
  Watch extends {
    [key in keyof D]?: WatchHandler<unknown> | WatchOptionsWithHandler<unknown>
  } = {
    [key in keyof D]?: WatchHandler<any> | WatchOptionsWithHandler<any>
  }
> = Omit<
  ComponentOptions<V, unknown, Methods, Computed, Props>,
  | 'data'
  | 'methods'
  | 'props'
  | 'watch'
  | 'created'
  | 'beforeDestroy'
  | 'destroyed'
  | 'beforeMount'
  | 'mounted'
  | 'beforeUpdate'
  | 'updated'
  | 'activated'
  | 'deactivated'
> & {
  data?: () => D
  methods?: Methods
  props?: PropsDefinition<Props>
  watch?: Watch extends {
    [key in keyof D]?: infer V
  }
    ? {
        [key in keyof D]?: V extends WatchHandler<infer Value>
          ? Value extends any
            ? WatchHandler<D[key]>
            : WatchHandler<Value>
          : V extends WatchOptionsWithHandler<infer Value>
          ? Value extends any
            ? WatchOptionsWithHandler<D[key]>
            : WatchOptionsWithHandler<Value>
          : never
      }
    : never
  syncToSigi?: (keyof StateInEffectModule<M>)[]
  created?: () => void
  beforeDestroy?: () => void
  destroyed?: () => void
  beforeMount?: () => void
  mounted?: () => void
  beforeUpdate?: () => void
  updated?: () => void
  activated?: () => void
  deactivated?: () => void
} & ThisType<
    V & Methods & Computed & D & StateInEffectModule<M> & ActionOfEffectModule<M, StateInEffectModule<M>> & Props
  >

export const reactive = <M extends EffectModule<any>, D, Methods, Computed, Props>(
  EffectModuleConstructor: ConstructorOf<M>,
  componentOptions: ReactiveComponentOptions<M, Vue, D, Methods, Computed, Props>,
): ComponentOptions<
  Vue,
  D extends never ? object : D & StateInEffectModule<M>,
  (Methods extends undefined ? object : Methods) & ActionOfEffectModule<M, StateInEffectModule<M>>,
  Computed,
  Props extends unknown ? RecordPropsDefinition<DefaultProps> : Props
> => {
  const effectModule = rootInjector.getInstance(EffectModuleConstructor)
  const store = effectModule.createStore() as Store
  const initialState: StateInEffectModule<M> = store.getState()
  const statePassToVue = { ...initialState }
  const subscription = store.state$.subscribe((state) => {
    Object.assign(statePassToVue, state)
  })
  const actionsCreator = effectModule.getActions()
  const dispatchProps = Object.keys(actionsCreator).reduce((acc, cur) => {
    acc[cur] = (payload: any) => {
      const action = (actionsCreator as any)[cur](payload)
      store.dispatch(action)
    }
    return acc
  }, Object.create(null))

  const { beforeDestroy: originalBeforeDestory } = componentOptions

  componentOptions.beforeDestroy = function beforeDestroy() {
    subscription.unsubscribe()
    typeof originalBeforeDestory === 'function' ? originalBeforeDestory.call(this) : void 0
  }
  componentOptions.methods = componentOptions.methods ?? ({} as Methods)
  Object.assign(componentOptions.methods, dispatchProps)
  const { data: originalData } = componentOptions
  componentOptions.data = function data() {
    if (typeof originalData === 'function') {
      // eslint-disable-next-line @typescript-eslint/ban-types
      return Object.assign(statePassToVue, (originalData as Function).call(this))
    }
    return statePassToVue
  }

  const syncToSigi = componentOptions.syncToSigi ?? []
  const { beforeUpdate: originalBeforeUpdate } = componentOptions

  componentOptions.beforeUpdate = function beforeUpdate() {
    let latestState = store.getState()
    let changed = false
    for (const prop of syncToSigi) {
      if (!(prop in statePassToVue) && process.env.NODE_ENV === 'development') {
        console.warn(`${prop} in syncToSigi option is not existed in defaultProps property in Sigi module`)
      }
      const propValue = (this as any)[prop]
      if (propValue !== latestState[prop]) {
        latestState = { ...latestState, [prop]: cloneDeepPoj(propValue) }
        changed = true
      }
    }
    if (changed) {
      store.state$.next(latestState)
    }
    if (typeof originalBeforeUpdate === 'function') {
      originalBeforeUpdate.call(this)
    }
  }

  return componentOptions
}
