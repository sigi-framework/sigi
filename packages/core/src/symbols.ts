const IS_PROD = process.env.NODE_ENV === 'production'

// =============       decorator symbols          =============
export const EFFECT_DECORATOR_SYMBOL = IS_PROD ? 'E' : 'EFFECT_DECORATOR_SYMBOL'
export const REDUCER_DECORATOR_SYMBOL = IS_PROD ? 'R' : 'REDUCER_DECORATOR_SYMBOL'
export const IMMER_REDUCER_DECORATOR_SYMBOL = IS_PROD ? 'IR' : 'IMMER_REDUCER_DECORATOR_SYMBOL'
export const DEFINE_ACTION_DECORATOR_SYMBOL = IS_PROD ? 'D' : 'DEFINE_ACTION_DECORATOR_SYMBOL'

// =============   internal action type symbols   =============
export const INIT_ACTION_TYPE_SYMBOL = IS_PROD ? 'IA' : 'INIT_ACTION_TYPE_SYMBOL'
export const NOOP_ACTION_TYPE_SYMBOL = IS_PROD ? 'N' : 'NOOP_ACTION_TYPE_SYMBOL'
export const TERMINATE_ACTION_TYPE_SYMBOL = IS_PROD ? 'T' : 'TERMINATE_ACTION_TYPE_SYMBOL'
export const RESET_ACTION_TYPE_SYMBOL = IS_PROD ? 'RST' : 'RESET_ACTION_TYPE_SYMBOL'
export const RETRY_ACTION_TYPE_SYMBOL = IS_PROD ? 'RT' : 'RETRY_ACTION_TYPE_SYMBOL'

// =============       SSR related symbols        =============
export const SSR_ACTION_META_SYMBOL = IS_PROD ? 'SA' : 'SSR_ACTION_META_SYMBOL'
export const ACTION_TO_SKIP_SYMBOL = IS_PROD ? 'RS' : 'ACTION_TO_SKIP_SYMBOL'
export const GLOBAL_KEY_SYMBOL = 'SIGI_STATE'
export const RETRY_KEY_SYMBOL = 'SIGI_RETRY'
