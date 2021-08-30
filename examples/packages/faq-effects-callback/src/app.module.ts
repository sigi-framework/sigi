import { Module, EffectModule, Reducer, Effect, Action } from '@stringke/sigi-core'
import { message } from 'antd'
import { Observable, of } from 'rxjs'
import { exhaustMap, takeUntil, map, tap, startWith, catchError } from 'rxjs/operators'

import { HttpClient } from './http.service'

interface AppState {
  list: string[] | null | Error
}

@Module('App')
export class AppModule extends EffectModule<AppState> {
  defaultState: AppState = {
    list: [],
  }

  constructor(private readonly httpClient: HttpClient) {
    super()
  }

  @Reducer()
  cancel(state: AppState) {
    return { ...state, ...this.defaultState }
  }

  @Reducer()
  setList(state: AppState, list: AppState['list']) {
    return { ...state, list }
  }

  @Effect()
  fetchList(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      exhaustMap(() => {
        return this.httpClient.get(`/resources`).pipe(
          tap(
            () => {
              message.success('Got response')
            },
            (e) => {
              message.error(e.message)
            },
          ),
          map((response) => this.getActions().setList(response)),
          catchError((e) => of(this.getActions().setList(e))),
          startWith(this.getActions().setList(null)),
          takeUntil(this.getAction$().cancel),
        )
      }),
    )
  }
}
