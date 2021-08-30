import { Action } from '@stringke/sigi-types'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export let logStoreAction: (action: Action<unknown>) => void = (_action) => {}

export const replaceLogger = (logger: typeof logStoreAction) => (logStoreAction = logger)
