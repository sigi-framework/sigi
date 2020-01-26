import { Action } from '@sigi/types'

export let logStateAction: (action: Action<unknown>) => void = (_action) => {}

export const replaceLogger = (logger: typeof logStateAction) => (logStateAction = logger)
