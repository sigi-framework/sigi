export const EFFECT_DECORATOR_SYMBOL = process.env.NODE_ENV === 'production' ? Symbol() : Symbol('decorator:effect')

export const REDUCER_DECORATOR_SYMBOL = process.env.NODE_ENV === 'production' ? Symbol() : Symbol('decorator:reducer')

export const IMMER_REDUCER_DECORATOR_SYMBOL =
  process.env.NODE_ENV === 'production' ? Symbol() : Symbol('decorator:immer-reducer')

export const DEFINE_ACTION_DECORATOR_SYMBOL =
  process.env.NODE_ENV === 'production' ? Symbol() : Symbol('decorator:define-action')

export const StoreInterface = process.env.NODE_ENV === 'production' ? Symbol() : Symbol('effect-state')
