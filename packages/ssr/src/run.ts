import { from, race, timer, throwError, Subject, noop, Observable, Observer } from 'rxjs'
import { flatMap, bufferCount, take, filter, tap } from 'rxjs/operators'
import { rootInjector } from '@sigi/di'
import { ConstructorOf, Action, State } from '@sigi/types'
import { Ayanami, TERMINATE_ACTION, SSRSymbol } from '@sigi/core'

import { SKIP_SYMBOL } from './ssr-effect'
import { SSRStateCacheInstance } from './ssr-states'
import { oneShotCache } from './ssr-oneshot-cache'

export type ModuleMeta = ConstructorOf<Ayanami<any>>

const skipFn = () => SKIP_SYMBOL

/**
 * Run all @SSREffect decorated effects of given modules and extract latest states.
 * `cleanup` function returned must be called before end of responding
 *
 * @param ctx request context, which will be passed to payloadGetter in SSREffect decorator param
 * @param modules used ayanami modules
 * @param uuid the same uuid would reuse the same state which was created before
 * @param timeout seconds to wait before all effects stream out TERMINATE_ACTION
 * @returns object contains ayanami state and cleanup function
 */
export const runSSREffects = <Context, Returned = any>(
  ctx: Context,
  modules: ModuleMeta[],
  sharedCtx?: string | symbol,
  timeout = 3,
): Promise<Returned> => {
  const stateToSerialize: any = {}
  return modules.length === 0
    ? Promise.resolve(stateToSerialize)
    : race(
        from(modules).pipe(
          flatMap((constructor) => {
            return new Observable((observer: Observer<Returned>) => {
              let cleanup = noop
              const metas = Reflect.getMetadata(SSRSymbol, constructor.prototype) || []
              let ayanamiState: State<any>
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
                  ayanamiState = SSRStateCacheInstance.get(sharedCtx, constructor)!
                  moduleName = constructor.prototype.moduleName
                } else {
                  const ayanamiInstance: Ayanami<unknown> = rootInjector.resolveAndInstantiate(constructor)
                  moduleName = ayanamiInstance.moduleName
                  ayanamiState = ayanamiInstance.createState(middleware)
                  SSRStateCacheInstance.set(sharedCtx, constructor, ayanamiState)
                }
              } else {
                const ayanamiInstance: Ayanami<unknown> = rootInjector.resolveAndInstantiate(constructor)
                moduleName = ayanamiInstance.moduleName
                ayanamiState = ayanamiInstance.createState(middleware)
                oneShotCache.store(ctx, constructor, ayanamiState)
              }
              let effectsCount = metas.length
              let disposeFn = noop
              cleanup = sharedCtx
                ? () => disposeFn()
                : () => {
                    ayanamiState.unsubscribe()
                  }
              async function runEffects() {
                await Promise.all(
                  metas.map(async (meta: any) => {
                    if (meta.middleware) {
                      const param = await meta.middleware(ctx, skipFn)
                      if (param !== SKIP_SYMBOL) {
                        ayanamiState.dispatch({
                          type: meta.action,
                          payload: param,
                          state: ayanamiState,
                        })
                      } else {
                        effectsCount -= 1
                      }
                    } else {
                      ayanamiState.dispatch({
                        type: meta.action,
                        payload: undefined,
                        state: ayanamiState,
                      })
                    }
                  }),
                )

                if (effectsCount > 0) {
                  const action$ = new Subject<Action<unknown>>()
                  disposeFn = ayanamiState.subscribeAction((action) => {
                    action$.next(action)
                  })
                  await action$
                    .pipe(
                      filter((act) => act.type === TERMINATE_ACTION.type),
                      bufferCount(effectsCount),
                      take(1),
                    )
                    .toPromise()

                  const state = ayanamiState.getState()
                  stateToSerialize[moduleName] = state
                }
              }
              runEffects()
                .then(() => {
                  observer.next(stateToSerialize)
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
