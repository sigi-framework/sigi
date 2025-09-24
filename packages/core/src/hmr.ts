import { IStore } from '@sigi/types'

export const hmrEnabled =
  process.env.NODE_ENV === 'development' && // webpack
  ((typeof module !== 'undefined' && typeof (module as any).hot === 'object') ||
    // vite
    // @ts-expect-error
    ('hot' in import.meta && import.meta.hot !== null))

export let hmrInstanceCache: Map<string, IStore<any>>

if (hmrEnabled) {
  hmrInstanceCache = new Map()
}
