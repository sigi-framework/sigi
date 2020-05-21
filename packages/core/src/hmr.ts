export const isDevelopment = process.env.NODE_ENV === 'development'
// @ts-expect-error
export const hmrEnabled = isDevelopment && module.hot

export let hmrInstanceCache: Map<string, any>

if (hmrEnabled) {
  hmrInstanceCache = new Map()
}
