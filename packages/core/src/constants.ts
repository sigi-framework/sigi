import { Action } from '@sigi/types'

export const SSRSymbol = process.env.NODE_ENV === 'development' ? Symbol('AyanamiSSR') : Symbol()
export const GLOBAL_KEY = Symbol.for('SIGI_GLOBAL_MODULE_CACHE')
export const SSR_LOADED_KEY = process.env.NODE_ENV === 'development' ? Symbol('SSR_LOADED') : Symbol()
export const ACTION_TO_SKIP_KEY = process.env.NODE_ENV === 'development' ? Symbol('ACTION_TO_SKIP') : Symbol()
export const INIT_ACTION_TYPE = 'INIT_AYANAMI_STATE'

export const TERMINATE_ACTION: Action<null> = {
  type: Symbol('terminate'),
  payload: null,
  state: null,
} as any
