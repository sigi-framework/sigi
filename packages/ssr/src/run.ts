import { EffectModule, TERMINATE_ACTION_TYPE_SYMBOL, getSSREffectMeta, RETRY_ACTION_TYPE_SYMBOL } from '@sigi/core'
import { rootInjector, Injector, Provider } from '@sigi/di'
import { ConstructorOf, Action, Epic } from '@sigi/types'
import { Observable, NEVER } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'

import { StateToPersist } from './state-to-persist'

export type ModuleMeta = ConstructorOf<EffectModule<any>>

const SKIP_SYMBOL = Symbol('skip-symbol')

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
  const pendingState = new Promise<void>((resolve, reject) => {
    if (!modules.length) {
      return resolve()
    }
    timer = setTimeout(() => {
      reject(new Error('Terminate timeout'))
    }, timeout * 1000)
    for (const constructor of modules) {
      const ssrActionsMeta = getSSREffectMeta(constructor.prototype, [])!

      const errorCatcher = (prevEpic: Epic) => (action$: Observable<Action<unknown>>) =>
        prevEpic(action$).pipe(
          catchError((e) => {
            reject(e)
            return NEVER
          }),
        )

      const effectModuleInstance: EffectModule<unknown> = injector.getInstance(constructor)
      const { store, moduleName } = effectModuleInstance
      store.addEpic(errorCatcher)

      effectsCount += ssrActionsMeta.length

      const cleanup = store.addEpic((prevEpic) => {
        return (action$) =>
          prevEpic(action$).pipe(
            tap(({ type, payload }) => {
              if (type === RETRY_ACTION_TYPE_SYMBOL) {
                const { module, name } = payload as any
                if (!actionsToRetry[module.moduleName]) {
                  actionsToRetry[module.moduleName] = [name] as string[]
                } else {
                  actionsToRetry[module.moduleName].push(name as string)
                }
              }
              if (type === TERMINATE_ACTION_TYPE_SYMBOL) {
                terminatedCount++
              }
              if (terminatedCount === effectsCount) {
                resolve()
              }
            }),
          )
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
        store.dispose()
        cleanup()
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
      }
      for (const cleanup of cleanupFns) {
        cleanup()
      }
      return new StateToPersist(stateToSerialize, actionsToRetry)
    })
    .catch((e) => {
      for (const cleanup of cleanupFns) {
        cleanup()
      }
      throw e
    })

  return { injector, pendingState }
}
