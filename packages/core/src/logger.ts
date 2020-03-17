import { Action } from '@sigi/types'

export let logStoreAction: (action: Action<unknown>) => void = (_action) => {}

export const replaceLogger = (logger: typeof logStoreAction) => (logStoreAction = logger)
