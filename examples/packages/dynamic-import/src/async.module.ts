import { Module, EffectModule, Reducer, Effect, Action } from '@sigi/core'
import { Observable, of } from 'rxjs'
import { exhaustMap, takeUntil, map, tap, startWith, catchError } from 'rxjs/operators'

import { HttpClient } from './http.service'

interface AsyncState {
  list: string[] | null | Error
}

@Module('Async')
export class AsyncModule extends EffectModule<AsyncState> {
  defaultState: AsyncState = {
    list: [],
  }

  constructor(private readonly httpClient: HttpClient) {
    super()
  }

  @Reducer()
  cancel(state: AsyncState) {
    return { ...state, ...this.defaultState }
  }

  @Reducer()
  setList(state: AsyncState, list: AsyncState['list']) {
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
          catchError((e) => of(this.getActions().setList(e))),
          startWith(this.getActions().setList(null)),
          takeUntil(this.getAction$().cancel),
        )
      }),
    )
  }
}
