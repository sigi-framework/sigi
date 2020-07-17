/* eslint-disable @typescript-eslint/ban-types */

import { EffectModule, ActionOfEffectModule, StateInEffectModule } from '@sigi/core'
import { rootInjector } from '@sigi/di'
import { ConstructorOf } from '@sigi/types'
import Vue, { ComponentOptions } from 'vue'
import { RecordPropsDefinition, DataDef } from 'vue/types/options'
import { CombinedVueInstance } from 'vue/types/vue'

import { cloneDeepPoj } from './utils'

type ReactiveComponentOptions<M extends EffectModule<any>, V extends Vue, Data, Methods, Computed, Prop> = {
  syncToSigi?: Array<keyof StateInEffectModule<M>>
} & (Prop extends string
  ? ComponentOptions<V, DataDef<Data, Record<Prop, any>, V>, Methods, Computed, Prop[], Record<Prop, any>> &
      ThisType<
        CombinedVueInstance<
          V,
          StateInEffectModule<M> & Data,
          ActionOfEffectModule<M, StateInEffectModule<M>> & Methods,
          Computed,
          Readonly<Record<Prop, any>>
        >
      >
  : ComponentOptions<V, DataDef<Data, Prop, V>, Methods, Computed, RecordPropsDefinition<Prop>, Prop> &
      ThisType<
        CombinedVueInstance<
          V,
          StateInEffectModule<M> & Data,
          ActionOfEffectModule<M, StateInEffectModule<M>> & Methods,
          Computed,
          Readonly<Prop>
        >
      >)

export const reactive = <
  M extends EffectModule<any>,
  V extends Vue,
  Data,
  Methods,
  Computed,
  PropDef = object,
  Props = object
>(
  EffectModuleConstructor: ConstructorOf<M>,
  componentOptions: ReactiveComponentOptions<M, V, Data, Methods, Computed, PropDef>,
): ComponentOptions<
  V,
  StateInEffectModule<M> & (Data extends never ? object : Data extends (...args: any) => any ? ReturnType<Data> : Data),
  ActionOfEffectModule<M, StateInEffectModule<M>> & (Methods extends never ? object : Methods),
  Computed,
  PropDef,
  Props
> => {
  const effectModule = rootInjector.getInstance(EffectModuleConstructor)
  const store = effectModule.setupStore()
  const initialState: StateInEffectModule<M> = store.state
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

  const { beforeDestroy: originalBeforeDestroy } = componentOptions

  componentOptions.beforeDestroy = function beforeDestroy() {
    subscription.unsubscribe()
    typeof originalBeforeDestroy === 'function' ? originalBeforeDestroy.call(this) : void 0
  }

  componentOptions.methods = Object.assign(dispatchProps, componentOptions.methods ?? {})

  const { data: originalData } = componentOptions
  componentOptions.data = function data(this: Vue) {
    if (typeof originalData === 'function') {
      return Object.assign(statePassToVue, (originalData as Function).call(this))
    }

    return statePassToVue
  }

  const syncToSigi = componentOptions.syncToSigi ?? []
  const { beforeUpdate: originalBeforeUpdate } = componentOptions

  componentOptions.beforeUpdate = function beforeUpdate() {
    let latestState = store.state
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

  // @ts-expect-error
  return componentOptions
}
