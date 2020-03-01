import { Action } from '@sigi/types'

export const SSR_ACTION_META = process.env.NODE_ENV === 'development' ? Symbol('SIGI_SSR_ACTIONS') : Symbol()
export const GLOBAL_KEY = Symbol.for('SIGI_GLOBAL_MODULE_CACHE')
export const SSR_LOADED_KEY = process.env.NODE_ENV === 'development' ? Symbol('SSR_LOADED') : Symbol()
export const ACTION_TO_SKIP_KEY = process.env.NODE_ENV === 'development' ? Symbol('ACTION_TO_SKIP') : Symbol()
export const INIT_ACTION_TYPE = 'INIT_SIGI_STATE'

export const TERMINATE_ACTION: Action<null> = {
  type: Symbol('terminate'),
  payload: null,
  state: null,
} as any
