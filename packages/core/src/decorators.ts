import { Action } from '@sigi/types'
import { Draft } from 'immer'
import { Observable } from 'rxjs'

import { SSR_ACTION_META, ACTION_TO_SKIP_KEY } from './constants'
import {
  IMMER_REDUCER_DECORATOR_SYMBOL,
  REDUCER_DECORATOR_SYMBOL,
  EFFECT_DECORATOR_SYMBOL,
  DEFINE_ACTION_DECORATOR_SYMBOL,
} from './symbols'

function createActionDecorator(decoratorSymbol: symbol) {
  return () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor
    const decoratedActionNames: string[] = Reflect.getMetadata(decoratorSymbol, constructor) || []
    Reflect.defineMetadata(decoratorSymbol, [...decoratedActionNames, propertyKey], constructor)
    return descriptor
  }
}

interface DecoratorReturnType<V> {
  (target: any, propertyKey: string, descriptor: { value?: V }): PropertyDescriptor
}

export const ImmerReducer: <S = any>() => DecoratorReturnType<
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  (state: Draft<S>, params: any) => undefined | void
> = createActionDecorator(IMMER_REDUCER_DECORATOR_SYMBOL)

export const Reducer: <S = any>() => DecoratorReturnType<(state: S, params: any) => S> = createActionDecorator(
  REDUCER_DECORATOR_SYMBOL,
)

interface EffectOptions {
  ssr?: boolean
  /**
   * Function used to get effect payload.
   *
   * if SKIP_SYMBOL , effect won't get dispatched when SSR
   *
   * @param ctx context
   * @param skipSymbol the skip symbol
   */
  payloadGetter?: (ctx: any, skipSymbol: symbol) => any | Promise<any>

  /**
   * Whether skip first effect dispatching in client if effect ever got dispatched when SSR
   *
   * @default true
   */
  skipFirstClientDispatch?: boolean
}

function addSSRMeta(target: any, method: string, payloadGetter: EffectOptions['payloadGetter']) {
  const meta = Reflect.getMetadata(SSR_ACTION_META, target)
  const action = { action: method, payloadGetter }
  if (meta) {
    meta.push(action)
  } else {
    Reflect.defineMetadata(SSR_ACTION_META, [action], target)
  }
}

export const Effect: <A = any>(
  options?: EffectOptions,
) => DecoratorReturnType<(action: Observable<A>) => Observable<Action<unknown>>> = (options) => {
  const effect = createActionDecorator(EFFECT_DECORATOR_SYMBOL)

  if (options && (options.ssr || options.payloadGetter)) {
    const { payloadGetter, skipFirstClientDispatch } = {
      payloadGetter: undefined,
      skipFirstClientDispatch: true,
      ...options,
    }

    return (target: any, method: string, descriptor: PropertyDescriptor) => {
      addSSRMeta(target, method, payloadGetter)
      if (skipFirstClientDispatch) {
        const actionsToSkip: Set<string> = Reflect.getMetadata(ACTION_TO_SKIP_KEY, target) || new Set()
        actionsToSkip.add(method)
        Reflect.defineMetadata(ACTION_TO_SKIP_KEY, actionsToSkip, target)
      }
      return Effect()(target, method, descriptor)
    }
  }

  return effect()
}

export const DefineAction: () => any = createActionDecorator(DEFINE_ACTION_DECORATOR_SYMBOL)
