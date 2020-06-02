import { EffectModule, Module, Reducer, Effect, Action } from '@sigi/core'
import { History, LocationState, LocationDescriptorObject, Location, Action as HistoryAction } from 'history'
import { Observable, Subject, noop } from 'rxjs'
import { tap, map, withLatestFrom } from 'rxjs/operators'

export interface RouterState {
  history: History | null
  historyListenerTeardown: () => void
}

export type HistoryMethods = 'go' | 'goBack' | 'goForward' | 'push' | 'replace'

export interface RouterChanged<S = History.PoorMansUnknown> {
  location: Location<S>
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
        'History in RouterModule has already defined, have you wrapped your application with SigiRouterProvider muti times?',
      )
    }
    const historyListenerTeardown = history.listen((location, action) => {
      this.router$.next({ location, action })
    })
    return { history, historyListenerTeardown }
  }

  push(location: LocationDescriptorObject<LocationState>): Action<CallHistoryPayload>

  push(path: string, state?: LocationState): Action<CallHistoryPayload>

  push(path: LocationDescriptorObject<LocationState> | string, state?: LocationState): Action<CallHistoryPayload> {
    return this.getActions()._callHistory({ method: 'push', payloads: [path, state] })
  }

  go(n: number) {
    return this.getActions()._callHistory({ method: 'go', payloads: [n] })
  }

  goBack(): Action<CallHistoryPayload> {
    return this.getActions()._callHistory({ method: 'goBack', payloads: [] })
  }
  goForward(): Action<CallHistoryPayload> {
    return this.getActions()._callHistory({ method: 'goForward', payloads: [] })
  }

  replace(path: string, state?: LocationState): Action<CallHistoryPayload>
  replace(location: LocationDescriptorObject<LocationState>): Action<CallHistoryPayload>

  replace(path: string | LocationDescriptorObject<LocationState>, state?: LocationState): Action<CallHistoryPayload> {
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
