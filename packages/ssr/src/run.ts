import { from, race, timer, throwError, Subject, noop, Observable, Observer } from 'rxjs'
import { flatMap, bufferCount, take, filter, tap } from 'rxjs/operators'
import { rootInjector } from '@sigi/di'
import { ConstructorOf, Action, Store } from '@sigi/types'
import { EffectModule, TERMINATE_ACTION, SSRSymbol } from '@sigi/core'

import { SKIP_SYMBOL } from './ssr-effect'
import { SSRStateCacheInstance } from './ssr-states'
import { oneShotCache } from './ssr-oneshot-cache'
import { StateToPersist } from './state-to-persist'

export type ModuleMeta = ConstructorOf<EffectModule<any>>

const skipFn = () => SKIP_SYMBOL

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
              const metas = Reflect.getMetadata(SSRSymbol, constructor.prototype) || []
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
              let effectsCount = metas.length
              let disposeFn = noop
              cleanup = sharedCtx
                ? () => disposeFn()
                : () => {
                    store.unsubscribe()
                  }
              async function runEffects() {
                await Promise.all(
                  metas.map(async (meta: any) => {
                    if (meta.middleware) {
                      const param = await meta.middleware(ctx, skipFn)
                      if (param !== SKIP_SYMBOL) {
                        store.dispatch({
                          type: meta.action,
                          payload: param,
                          state: store,
                        })
                      } else {
                        effectsCount -= 1
                      }
                    } else {
                      store.dispatch({
                        type: meta.action,
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
