import { EffectModule, TERMINATE_ACTION_TYPE_SYMBOL, getSSREffectMeta, RETRY_ACTION_TYPE_SYMBOL } from '@sigi/core'
import { rootInjector, Injector, Provider } from '@sigi/di'
import { ConstructorOf, Action } from '@sigi/types'

import { StateToPersist } from './state-to-persist'

export type ModuleMeta = ConstructorOf<EffectModule<any>>

export const SKIP_SYMBOL = Symbol('skip-symbol')

/**
 * Run all `@Effect({ ssr: true })` decorated effects of given modules and extract latest states.
 * `cleanup` function returned must be called before end of responding
 *
 * @param ctx request context, which will be passed to payloadGetter in SSREffect decorator param
 * @param modules used EffectModules
 * @param config
 * @param config.providers providers to override the default services
 * @param config.uuid the same uuid would reuse the same state which was created before
 * @param config.timeout seconds to wait before all effects stream out TERMINATE_ACTION, default is `1`.
 * @returns EffectModule states
 */
export const runSSREffects = <Context, Returned = any>(
  ctx: Context,
  modules: ModuleMeta[],
  config: {
    timeout?: number
    providers?: Provider[]
  } = {},
): { injector: Injector; pendingState: Promise<StateToPersist<Returned>> } => {
  const stateToSerialize = {} as Returned
  const actionsToRetry: { [index: string]: string[] } = {}
  const { providers, timeout = 1 } = config
  const injector = rootInjector.createChild([...modules, ...(providers ?? [])])
  const cleanupFns: (() => void)[] = []
  let timer: NodeJS.Timer | null = null
  let terminatedCount = 0
  let effectsCount = 0
  const moduleInstanceCache = new Map()
  // @ts-expect-error
  injector.serverCache = moduleInstanceCache
  const pendingState = new Promise<void>((resolve, reject) => {
    if (!modules.length) {
      return resolve()
    }
    timer = setTimeout(() => {
      reject(new Error('Terminate timeout'))
    }, timeout * 1000)
    for (const constructor of modules) {
      const ssrActionsMeta = getSSREffectMeta(constructor.prototype, [])!

      const effectModuleInstance: EffectModule<unknown> = injector.getInstance(constructor)

      moduleInstanceCache.set(constructor, effectModuleInstance)

      const { store, moduleName } = effectModuleInstance

      effectsCount += ssrActionsMeta.length

      const subscription = store.action$.subscribe({
        next: ({ type, payload }) => {
          if (type === RETRY_ACTION_TYPE_SYMBOL) {
            const { name } = payload as Action<{ name: string }>['payload']
            if (!actionsToRetry[moduleName]) {
              actionsToRetry[moduleName] = [name] as string[]
            } else {
              actionsToRetry[moduleName].push(name as string)
            }
          }
          if (type === TERMINATE_ACTION_TYPE_SYMBOL) {
            terminatedCount++
          }
          if (terminatedCount === effectsCount) {
            resolve()
          }
        },
        error: (e) => {
          reject(e)
        },
      })

      for (const ssrActionMeta of ssrActionsMeta) {
        if (ssrActionMeta.payloadGetter) {
          let maybeDeferredPayload: any
          try {
            maybeDeferredPayload = ssrActionMeta.payloadGetter(ctx, SKIP_SYMBOL)
          } catch (e) {
            return reject(e)
          }
          Promise.resolve(maybeDeferredPayload)
            .then((payload) => {
              if (payload !== SKIP_SYMBOL) {
                store.dispatch({
                  type: ssrActionMeta.action,
                  payload,
                  store,
                })
              } else {
                if (!actionsToRetry[moduleName]) {
                  actionsToRetry[moduleName] = [ssrActionMeta.action]
                } else {
                  actionsToRetry[moduleName].push(ssrActionMeta.action)
                }
                effectsCount--
                if (terminatedCount === effectsCount) {
                  resolve()
                }
              }
            })
            .catch((e) => {
              reject(e)
            })
        } else {
          store.dispatch({
            type: ssrActionMeta.action,
            payload: undefined,
            store,
          })
        }
      }
      cleanupFns.push(() => {
        subscription.unsubscribe()
        store.dispose()
        stateToSerialize[moduleName] = store.state
      })
    }
    if (!effectsCount) {
      resolve()
    }
  })

    // Could not use `finally` here, because we need support Node.js@10
    .then(() => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      for (const cleanup of cleanupFns) {
        cleanup()
      }
      return new StateToPersist(stateToSerialize, actionsToRetry)
    })
    .catch((e) => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      for (const cleanup of cleanupFns) {
        cleanup()
      }
      throw e
    })

  return { injector, pendingState }
}
