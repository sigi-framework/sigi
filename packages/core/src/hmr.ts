import { IStore } from '@stringke/sigi-types'

// @ts-expect-error
export const hmrEnabled = process.env.NODE_ENV === 'development' && module.hot

export let hmrInstanceCache: Map<string, IStore<any>>

if (hmrEnabled) {
  hmrInstanceCache = new Map()
}
