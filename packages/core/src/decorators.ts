import { Action } from '@sigi/types'
import { Draft } from 'immer'
import { Observable } from 'rxjs'

import { createActionDecorator, addSSREffectMeta, addActionToSkip } from './metadata'

interface DecoratorReturnType<V> {
  (target: any, propertyKey: string, descriptor: { value?: V }): PropertyDescriptor
}

export const DefineAction: () => any = createActionDecorator('DefineAction')

export const ImmerReducer: <S = any>() => DecoratorReturnType<(state: Draft<S>, params: any) => void> =
  createActionDecorator('ImmerReducer')

export const Reducer: <S = any>() => DecoratorReturnType<(state: S, params: any) => S> =
  createActionDecorator('Reducer')

export interface EffectOptions {
  ssr?: boolean
  /**
   * Function used to get effect payload.
   *
   * if SKIP_SYMBOL(passed from the second parameter) returned, effect won't get dispatched when SSR
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

export const Effect: <A = any>(
  options?: EffectOptions,
) => DecoratorReturnType<(action: Observable<A>) => Observable<Action>> = (options) => {
  const effectDecorator = createActionDecorator('Effect')

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (options && (options.ssr || options.payloadGetter)) {
    const { payloadGetter, skipFirstClientDispatch } = {
      payloadGetter: undefined,
      skipFirstClientDispatch: true,
      ...options,
    }

    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      addSSREffectMeta(target, { action: propertyKey, payloadGetter })
      if (skipFirstClientDispatch) {
        addActionToSkip(target, propertyKey)
      }
      return Effect()(target, propertyKey, descriptor)
    }
  }

  return effectDecorator()
}
