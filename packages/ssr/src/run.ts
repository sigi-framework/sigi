import { EffectModule, TERMINATE_ACTION_TYPE_SYMBOL, getSSREffectMeta } from '@sigi/core'
import { rootInjector, Injector, Provider } from '@sigi/di'
import { ConstructorOf, Action, Epic, IStore } from '@sigi/types'
import { from, race, timer, throwError, noop, Observable, Observer, NEVER } from 'rxjs'
import { tap, catchError, mergeMap } from 'rxjs/operators'

import { oneShotCache } from './ssr-oneshot-cache'
import { SSRStateCacheInstance } from './ssr-states'
import { StateToPersist } from './state-to-persist'

export type ModuleMeta = ConstructorOf<EffectModule<any>>

const skipSymbol = Symbol('skip-symbol')

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
    uuid?: string | symbol
    timeout?: number
    providers?: Provider[]
  } = {},
): Promise<StateToPersist<Returned>> => {
  const stateToSerialize = {} as Returned
  const { providers, uuid, timeout = 1 } = config
  const injector = providers?.length ? new Injector(rootInjector).addProviders(providers) : rootInjector
  return modules.length === 0
    ? Promise.resolve(new StateToPersist(stateToSerialize))
    : race(
        from(modules).pipe(
          mergeMap((constructor) => {
            return new Observable((observer: Observer<StateToPersist<Returned>>) => {
              let cleanup = noop
              const ssrActionsMeta = getSSREffectMeta(constructor.prototype, [])!
              let store: IStore<any>
              let moduleName: string

              const errorCatcher = (prevEpic: Epic) => (action$: Observable<Action<unknown>>) =>
                prevEpic(action$).pipe(
                  catchError((e) => {
                    observer.error(e)
                    return NEVER
                  }),
                )

              if (uuid) {
                if (SSRStateCacheInstance.has(uuid, constructor)) {
                  store = SSRStateCacheInstance.get(uuid, constructor)!
                  moduleName = constructor.prototype.moduleName
                } else {
                  const effectModuleInstance: EffectModule<unknown> = injector.resolveAndInstantiate(constructor)
                  moduleName = effectModuleInstance.moduleName
                  store = effectModuleInstance.store
                  store.addEpic(errorCatcher)
                  SSRStateCacheInstance.set(uuid, constructor, store)
                }
              } else {
                const effectModuleInstance: EffectModule<unknown> = injector.resolveAndInstantiate(constructor)
                moduleName = effectModuleInstance.moduleName
                store = effectModuleInstance.store
                store.addEpic(errorCatcher)
                oneShotCache.store(ctx, constructor, store)
              }
              let effectsCount = ssrActionsMeta.length
              let disposeFn = noop
              cleanup = uuid
                ? () => disposeFn()
                : () => {
                    store.dispose()
                  }

              let donePromise: Promise<void> | null
              if (effectsCount > 0) {
                donePromise = new Promise<void>((resolve) => {
                  let terminatedCount = 0
                  disposeFn = store.addEpic((prevEpic) => {
                    return (action$) =>
                      prevEpic(action$).pipe(
                        tap(({ type }) => {
                          if (type === TERMINATE_ACTION_TYPE_SYMBOL) {
                            terminatedCount++
                            if (terminatedCount === effectsCount) {
                              resolve()
                            }
                          }
                        }),
                      )
                  })
                })
              }
              async function runEffects() {
                await Promise.all(
                  ssrActionsMeta.map(async (ssrActionMeta: any) => {
                    if (ssrActionMeta.payloadGetter) {
                      const payload = await ssrActionMeta.payloadGetter(ctx, skipSymbol)
                      if (payload !== skipSymbol) {
                        store.dispatch({
                          type: ssrActionMeta.action,
                          payload,
                          store,
                        })
                      } else {
                        effectsCount -= 1
                      }
                    } else {
                      store.dispatch({
                        type: ssrActionMeta.action,
                        payload: undefined,
                        store,
                      })
                    }
                  }),
                )

                return (
                  donePromise?.then(() => {
                    stateToSerialize[moduleName] = store.state
                  }) ?? Promise.resolve()
                )
              }
              runEffects()
                .then(() => {
                  observer.next(new StateToPersist(stateToSerialize))
                  observer.complete()
                })
                .catch((e) => {
                  observer.error(e)
                })
              return cleanup
            })
          }),
        ),
        timer(timeout * 1000).pipe(mergeMap(() => throwError(new Error('Terminate timeout')))),
      ).toPromise()
}
