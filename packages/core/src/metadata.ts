import type { EffectOptions } from './decorators'
import {
  DEFINE_ACTION_DECORATOR_SYMBOL,
  REDUCER_DECORATOR_SYMBOL,
  IMMER_REDUCER_DECORATOR_SYMBOL,
  EFFECT_DECORATOR_SYMBOL,
  SSR_ACTION_META_SYMBOL,
  ACTION_TO_SKIP_SYMBOL,
} from './symbols'

const actionEnum = {
  DefineAction: DEFINE_ACTION_DECORATOR_SYMBOL,
  Reducer: REDUCER_DECORATOR_SYMBOL,
  ImmerReducer: IMMER_REDUCER_DECORATOR_SYMBOL,
  Effect: EFFECT_DECORATOR_SYMBOL,
}

export type ActionType = keyof typeof actionEnum

const metadataFactory = <T>(key: any) => {
  const get = (prototype: any, defaultValue?: T[]) => {
    const meta: T[] | undefined = Reflect.getMetadata(key, prototype)
    if (!meta || !Array.isArray(meta)) {
      return defaultValue
    }

    return meta
  }
  return {
    get,
    add: (prototype: any, meta: T) => {
      const stored = get(prototype)
      if (!stored) {
        Reflect.defineMetadata(key, [meta], prototype)
      } else {
        stored.push(meta)
      }
    },
  }
}

export function getDecoratedActions(prototype: any, type: ActionType, defaultValue?: string[]): string[] | undefined {
  const { get } = metadataFactory<string>(actionEnum[type])
  return get(prototype, defaultValue)
}

export function createActionDecorator(type: ActionType) {
  return () => (prototype: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (typeof prototype === 'function' || !propertyKey) {
      throw new Error(`${type} can only be used to decorate properties.`)
    }

    const { add } = metadataFactory<string>(actionEnum[type])
    add(prototype, propertyKey)
    return descriptor
  }
}

export const { get: getSSREffectMeta, add: addSSREffectMeta } = metadataFactory<{
  action: string
  payloadGetter?: EffectOptions['payloadGetter']
}>(SSR_ACTION_META_SYMBOL)
export const { get: getActionsToSkip, add: addActionToSkip } = metadataFactory<string>(ACTION_TO_SKIP_SYMBOL)
