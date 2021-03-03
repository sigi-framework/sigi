import { EffectModule, TERMINATE_ACTION_TYPE_SYMBOL, getSSREffectMeta } from '@sigi/core'
import { rootInjector, Injector, Provider } from '@sigi/di'
import { ConstructorOf, Action, Epic } from '@sigi/types'
import { from, race, timer, throwError, Observable, Observer, NEVER, noop } from 'rxjs'
import { tap, catchError, mergeMap } from 'rxjs/operators'

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
    timeout?: number
    providers?: Provider[]
  } = {},
): { injector: Injector; pendingState: Promise<StateToPersist<Returned>> } => {
  const stateToSerialize = {} as Returned
  const { providers, timeout = 1 } = config
  const injector = rootInjector.createChild([...modules, ...(providers ?? [])])
  const cleanupFns: (() => void)[] = []
  const pendingState =
    modules.length === 0
      ? Promise.resolve(new StateToPersist(stateToSerialize))
      : race(
          from(modules).pipe(
            mergeMap((constructor) => {
              return new Observable((observer: Observer<void>) => {
                const ssrActionsMeta = getSSREffectMeta(constructor.prototype, [])!

                const errorCatcher = (prevEpic: Epic) => (action$: Observable<Action<unknown>>) =>
                  prevEpic(action$).pipe(
                    catchError((e) => {
                      observer.error(e)
                      return NEVER
                    }),
                  )

                const effectModuleInstance: EffectModule<unknown> = injector.getInstance(constructor)
                const { store, moduleName } = effectModuleInstance
                store.addEpic(errorCatcher)
                let effectsCount = ssrActionsMeta.length
                let terminatedCount = 0

                const defer: { resolve: () => void; promise: Promise<void> } = {
                  resolve: noop,
                  promise: Promise.resolve(),
                }

                defer.promise = new Promise<void>((resolve) => {
                  defer.resolve = resolve
                })

                const cleanup: () => void = store.addEpic((prevEpic) => {
                  return (action$) =>
                    prevEpic(action$).pipe(
                      tap(({ type }) => {
                        if (type === TERMINATE_ACTION_TYPE_SYMBOL) {
                          terminatedCount++
                        }
                        if (terminatedCount === effectsCount) {
                          defer.resolve()
                        }
                      }),
                    )
                })

                Promise.all(
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
                        effectsCount--
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
                  .then(() => (effectsCount === 0 ? null : defer.promise))
                  .then(() => {
                    observer.next()
                    observer.complete()
                  })
                  .catch((e) => {
                    observer.error(e)
                  })
                cleanupFns.push(() => {
                  store.dispose()
                  cleanup()
                  stateToSerialize[moduleName] = store.state
                })
              })
            }),
          ),
          timer(timeout * 1000).pipe(mergeMap(() => throwError(new Error('Terminate timeout')))),
        )
          .toPromise()
          // Could not use `finally` here, because we need support Node.js@10
          .then(() => {
            for (const cleanup of cleanupFns) {
              cleanup()
            }
            return new StateToPersist(stateToSerialize)
          })
          .catch((e) => {
            for (const cleanup of cleanupFns) {
              cleanup()
            }
            throw e
          })

  return { injector, pendingState }
}
