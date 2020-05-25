import { EffectModule, TERMINATE_ACTION, SSR_ACTION_META } from '@sigi/core'
import { rootInjector } from '@sigi/di'
import { ConstructorOf, Action, Store } from '@sigi/types'
import { from, race, timer, throwError, Subject, noop, Observable, Observer } from 'rxjs'
import { flatMap, bufferCount, take, filter, tap } from 'rxjs/operators'

import { oneShotCache } from './ssr-oneshot-cache'
import { SSRStateCacheInstance } from './ssr-states'
import { StateToPersist } from './state-to-persist'

export type ModuleMeta = ConstructorOf<EffectModule<any>>

const skipSymbol = Symbol('skip-symbol')

/**
 * Run all @SSREffect decorated effects of given modules and extract latest states.
 * `cleanup` function returned must be called before end of responding
 *
 * @param ctx request context, which will be passed to payloadGetter in SSREffect decorator param
 * @param modules used EffectModules
 * @param uuid the same uuid would reuse the same state which was created before
 * @param timeout seconds to wait before all effects stream out TERMINATE_ACTION
 * @returns EffectModule state
 */
export const runSSREffects = <Context, Returned = any>(
  ctx: Context,
  modules: ModuleMeta[],
  sharedCtx?: string | symbol,
  timeout = 3,
): Promise<StateToPersist<Returned>> => {
  const stateToSerialize: any = {}
  return modules.length === 0
    ? Promise.resolve(new StateToPersist(stateToSerialize))
    : race(
        from(modules).pipe(
          flatMap((constructor) => {
            return new Observable((observer: Observer<StateToPersist<Returned>>) => {
              let cleanup = noop
              const ssrActionsMeta = Reflect.getMetadata(SSR_ACTION_META, constructor.prototype) || []
              let store: Store<any>
              let moduleName: string
              const middleware = (effect$: Observable<Action<unknown>>) =>
                effect$.pipe(
                  tap({
                    error: (e) => {
                      observer.error(e)
                    },
                  }),
                )
              if (sharedCtx) {
                if (SSRStateCacheInstance.has(sharedCtx, constructor)) {
                  store = SSRStateCacheInstance.get(sharedCtx, constructor)!
                  moduleName = constructor.prototype.moduleName
                } else {
                  const effectModuleInstance: EffectModule<unknown> = rootInjector.resolveAndInstantiate(constructor)
                  moduleName = effectModuleInstance.moduleName
                  store = effectModuleInstance.createStore(middleware)
                  SSRStateCacheInstance.set(sharedCtx, constructor, store)
                }
              } else {
                const effectModuleInstance: EffectModule<unknown> = rootInjector.resolveAndInstantiate(constructor)
                moduleName = effectModuleInstance.moduleName
                store = effectModuleInstance.createStore(middleware)
                oneShotCache.store(ctx, constructor, store)
              }
              let effectsCount = ssrActionsMeta.length
              let disposeFn = noop
              cleanup = sharedCtx
                ? () => disposeFn()
                : () => {
                    store.unsubscribe()
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
                          state: store,
                        })
                      } else {
                        effectsCount -= 1
                      }
                    } else {
                      store.dispatch({
                        type: ssrActionMeta.action,
                        payload: undefined,
                        state: store,
                      })
                    }
                  }),
                )

                if (effectsCount > 0) {
                  const action$ = new Subject<Action<unknown>>()
                  disposeFn = store.subscribeAction((action) => {
                    action$.next(action)
                  })
                  await action$
                    .pipe(
                      filter((act) => act.type === TERMINATE_ACTION.type),
                      bufferCount(effectsCount),
                      take(1),
                    )
                    .toPromise()

                  const state = store.getState()
                  stateToSerialize[moduleName] = state
                }
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
        timer(timeout * 1000).pipe(flatMap(() => throwError(new Error('Terminate timeout')))),
      ).toPromise()
}
