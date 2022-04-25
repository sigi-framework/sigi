import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { endWith, map, mergeMap, Observable, timer } from 'rxjs'

interface TipState {
  tip: string
}

@Module('TipModel')
export class TipModule extends EffectModule<TipState> {
  defaultState = { tip: '' }

  @ImmerReducer()
  setTip(state: Draft<TipState>, tip: string) {
    state.tip = tip
  }

  @Effect({ ssr: true })
  getTip(payload$: Observable<void>) {
    return payload$.pipe(
      mergeMap(() =>
        timer(1).pipe(
          map(() => this.getActions().setTip('tip')),
          endWith(this.terminate()),
        ),
      ),
    )
  }
}
