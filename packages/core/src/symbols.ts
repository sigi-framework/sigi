const isProduction = process.env.NODE_ENV === 'production'

// =============       decorator symbols          =============
export const EFFECT_DECORATOR_SYMBOL = isProduction ? Symbol() : Symbol('decorator:effect')
export const REDUCER_DECORATOR_SYMBOL = isProduction ? Symbol() : Symbol('decorator:reducer')
export const IMMER_REDUCER_DECORATOR_SYMBOL = isProduction ? Symbol() : Symbol('decorator:immer-reducer')
export const DEFINE_ACTION_DECORATOR_SYMBOL = isProduction ? Symbol() : Symbol('decorator:define-action')

// =============   internal action type symbols   =============
export const INIT_ACTION_TYPE_SYMBOL = isProduction ? Symbol() : Symbol('INIT_ACTION')
export const NOOP_ACTION_TYPE_SYMBOL = isProduction ? Symbol() : Symbol('NOOP_ACTION')
export const TERMINATE_ACTION_TYPE_SYMBOL = isProduction ? Symbol() : Symbol('TERMINATE_ACTION')
export const RESET_ACTION_TYPE_SYMBOL = isProduction ? Symbol() : Symbol('RESET_ACTION')

// =============       SSR related symbols        =============
export const SSR_ACTION_META_SYMBOL = isProduction ? Symbol() : Symbol('SIGI_SSR_ACTIONS')
export const ACTION_TO_SKIP_SYMBOL = isProduction ? Symbol() : Symbol('ACTION_TO_SKIP')
export const GLOBAL_KEY_SYMBOL = Symbol.for('SIGI_GLOBAL_MODULE_CACHE')

export const StoreInterface = isProduction ? Symbol() : Symbol('effect-state')
