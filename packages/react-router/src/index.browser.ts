import { EffectModule, Module, Effect } from '@sigi/core'
import { Inject, InjectionToken, ValueProvider } from '@sigi/di'
import { Action } from '@sigi/types'
import { Location, Action as HistoryAction, Path, History } from 'history'
import { Observable, Subject } from 'rxjs'
import { tap, map } from 'rxjs/operators'

export type HistoryMethods = 'go' | 'goBack' | 'goForward' | 'push' | 'replace'

export interface RouterChanged {
  location: Location
  action: HistoryAction
}

export interface CallHistoryPayload {
  method: HistoryMethods
  payloads: any[]
}

export const HistoryProvide: ValueProvider<History> = {
  provide: new InjectionToken('History'),
  // @ts-expect-error
  useValue: null,
}

export const Router$Provide: ValueProvider<Subject<RouterChanged>> = {
  provide: new InjectionToken('Router$'),
  // @ts-expect-error
  useValue: null,
}

@Module('@@Router')
export class RouterModule extends EffectModule<null> {
  readonly defaultState = null

  constructor(
    @Inject(HistoryProvide.provide) private readonly history: History,
    @Inject(Router$Provide.provide) public readonly router$: Observable<RouterChanged>,
  ) {
    super()
    if (process.env.NODE_ENV === 'development' && !history) {
      throw new Error(`History is null in the RouterModule, maybe you are missing SigiRouterProvider in your app`)
    }
  }

  push(path: Path, state?: any): Action<CallHistoryPayload> {
    return this.getActions()._callHistory({ method: 'push', payloads: [path, state] })
  }

  go(n: number) {
    return this.getActions()._callHistory({ method: 'go', payloads: [n] })
  }

  goBack() {
    return this.getActions()._callHistory({ method: 'goBack', payloads: [] })
  }
  goForward() {
    return this.getActions()._callHistory({ method: 'goForward', payloads: [] })
  }

  replace(path: Path, state?: any) {
    return this.getActions()._callHistory({ method: 'replace', payloads: [path, state] })
  }

  // @internal
  @Effect()
  _callHistory(payload$: Observable<CallHistoryPayload>) {
    return payload$.pipe(
      tap(({ method, payloads }) => {
        // @ts-expect-error
        this.history[method].apply(this.history, payloads)
      }),
      map(() => this.noop()),
    )
  }
}

export * from './router-provider'
