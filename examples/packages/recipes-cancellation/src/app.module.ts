import { Module, EffectModule, Reducer, Effect, Action } from '@sigi/core'
import { Observable } from 'rxjs'
import { exhaustMap, takeUntil, map, tap, startWith, endWith } from 'rxjs/operators'

import { HttpClient } from './http.service'

interface AppState {
  loading: boolean
  list: string[] | null
}

@Module('App')
export class AppModule extends EffectModule<AppState> {
  defaultState: AppState = {
    list: null,
    loading: false,
  }

  constructor(private readonly httpClient: HttpClient) {
    super()
  }

  @Reducer()
  cancel(state: AppState) {
    return { ...state, ...this.defaultState }
  }

  @Reducer()
  setLoading(state: AppState, loading: boolean) {
    return { ...state, loading }
  }

  @Reducer()
  setList(state: AppState, list: string[]) {
    return { ...state, list }
  }

  @Effect()
  fetchList(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      exhaustMap(() => {
        return this.httpClient.get(`/resources`).pipe(
          tap(() => {
            console.info('Got response')
          }),
          map((response) => this.getActions().setList(response)),
          startWith(this.getActions().setLoading(true)),
          endWith(this.getActions().setLoading(false)),
          takeUntil(this.getAction$().cancel),
        )
      }),
    )
  }
}
