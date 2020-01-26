import { Observable } from 'rxjs'
import { Draft } from 'immer'
import { Action } from '@sigi/types'

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
  (state: Draft<S>, params: any) => undefined | void
> = createActionDecorator(IMMER_REDUCER_DECORATOR_SYMBOL)

export const Reducer: <S = any>() => DecoratorReturnType<(state: S, params: any) => S> = createActionDecorator(
  REDUCER_DECORATOR_SYMBOL,
)

export const Effect: <A = any>() => DecoratorReturnType<
  (action: Observable<A>) => Observable<Action<unknown>>
> = createActionDecorator(EFFECT_DECORATOR_SYMBOL)

export const DefineAction: () => any = createActionDecorator(DEFINE_ACTION_DECORATOR_SYMBOL)
