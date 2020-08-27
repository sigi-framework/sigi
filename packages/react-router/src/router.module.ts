import { EffectModule, Module, Reducer, Effect } from '@sigi/core'
import { Action } from '@sigi/types'
import { History, Location, Action as HistoryAction, Path } from 'history'
import { Observable, Subject, noop } from 'rxjs'
import { tap, map, withLatestFrom } from 'rxjs/operators'

export interface RouterState {
  history: History | null
  historyListenerTeardown: () => void
}

export type HistoryMethods = 'go' | 'goBack' | 'goForward' | 'push' | 'replace'

export interface RouterChanged {
  location: Location
  action: HistoryAction
}

export interface CallHistoryPayload {
  method: HistoryMethods
  payloads: any[]
}

@Module('@@Router')
export class RouterModule extends EffectModule<RouterState> {
  readonly defaultState = {
    history: null,
    historyListenerTeardown: noop,
  }

  private readonly router$ = new Subject<RouterChanged>()

  createRouterObservable() {
    return this.router$.asObservable()
  }

  // @internal
  @Reducer()
  setHistory(state: RouterState, history: History) {
    if (state.history && process.env.NODE_ENV === 'development') {
      console.warn(
        'History in RouterModule has already defined, have you wrapped your application with SigiRouterProvider multi times?',
      )
    }
    const historyListenerTeardown = history.listen((location, action) => {
      this.router$.next({ location, action })
    })
    return { history, historyListenerTeardown }
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
  stopListen(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      tap(([, state]) => {
        state.historyListenerTeardown()
      }),
      map(() => this.noop()),
    )
  }

  // @internal
  @Effect()
  _callHistory(payload$: Observable<CallHistoryPayload>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      tap(([{ method, payloads }, state]) => {
        const history: any = state.history
        history[method].apply(state.history, payloads)
      }),
      map(() => this.noop()),
    )
  }
}
