import Vue, { ComponentOptions, WatchOptionsWithHandler } from 'vue'
import { EffectModule, ActionOfEffectModule, StateInEffectModule } from '@sigi/core'
import { rootInjector } from '@sigi/di'
import { ConstructorOf } from '@sigi/types'
import { Observable } from 'rxjs'
import { DefaultProps } from 'vue/types/options'

export type Prop<T> = { (): T } | { new (...args: never[]): T & object } | { new (...args: string[]): Function }

export type PropType<T> = Prop<T> | Prop<T>[]

export type PropValidator<T> = PropOptions<T> | PropType<T>

export interface PropOptions<T = any> {
  type?: PropType<T>
  required?: boolean
  default?: T | null | undefined | (() => T | null | undefined)
  validator?(value: T): boolean
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
  created?(): void
  beforeDestroy?(): void
  destroyed?(): void
  beforeMount?(): void
  mounted?(): void
  beforeUpdate?(): void
  updated?(): void
  activated?(): void
  deactivated?(): void
} & ThisType<
    V & Methods & Computed & D & StateInEffectModule<M> & ActionOfEffectModule<M, StateInEffectModule<M>> & Props
  >

export const reactive = <M extends EffectModule<any>, D, Methods, Computed, Props>(
  EffectModuleConstructor: ConstructorOf<M>,
  componentOptions: ReactiveComponentOptions<M, Vue, D, Methods, Computed, Props>,
): ComponentOptions<
  Vue,
  D extends never ? {} : D & StateInEffectModule<M>,
  (Methods extends undefined ? {} : Methods) & ActionOfEffectModule<M, StateInEffectModule<M>>,
  Computed,
  Props extends unknown ? RecordPropsDefinition<DefaultProps> : Props
> => {
  const effectModule = rootInjector.getInstance(EffectModuleConstructor)
  const state = effectModule.createState()
  const initialState: StateInEffectModule<M> = state.getState()
  const statePassToVue = { ...initialState }
  const subscription = ((state as any).state$ as Observable<StateInEffectModule<M>>).subscribe((state) => {
    Object.assign(statePassToVue, state)
  })
  const actionsCreator = effectModule.getActions()
  const dispatchProps = Object.keys(actionsCreator).reduce((acc, cur) => {
    acc[cur] = (payload: any) => {
      const action = (actionsCreator as any)[cur](payload)
      state.dispatch(action)
    }
    return acc
  }, Object.create(null))

  const { beforeDestroy } = componentOptions

  componentOptions.beforeDestroy = function () {
    subscription.unsubscribe()
    typeof beforeDestroy === 'function' ? beforeDestroy.call(this) : void 0
  }
  componentOptions.methods = componentOptions.methods ?? ({} as Methods)
  Object.assign(componentOptions.methods, dispatchProps)
  const { data } = componentOptions
  componentOptions.data = function () {
    if (typeof data === 'function') {
      return Object.assign(statePassToVue, (data as Function).call(this))
    }
    if (process.env.NODE_ENV !== 'production' && !!data) {
      console.warn(`data property is not function, ignored`)
    }
    return statePassToVue
  }
  return componentOptions
}
