import { EffectModule, Module, ImmerReducer, Effect, Action } from '@sigi-stringke/core'
import { Draft } from 'immer'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface CountState {
  count: number
}

@Module('Count')
export class CountModule extends EffectModule<CountState> {
  defaultState = {
    count: 0,
  }

  @ImmerReducer()
  set(state: Draft<CountState>, payload: number) {
    state.count = state.count + payload
  }

  @Effect()
  addLeastFive(payload$: Observable<number>): Observable<Action> {
    return payload$.pipe(
      map((payload) => {
        if (payload < 5) {
          return this.getActions().addLeastFive(payload + 1)
        }
        return this.getActions().set(payload)
      }),
    )
  }
}
