import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { endWith, map, mergeMap, Observable, switchMap, timer } from 'rxjs'

interface State {
  count: number
  name: string
}

@Module('CountModule')
export class CountModule extends EffectModule<State> {
  defaultState = { count: 0, name: '' }

  @ImmerReducer()
  setCount(state: Draft<State>, count: number) {
    state.count = count
  }

  @ImmerReducer()
  setName(state: Draft<State>, name: string) {
    state.name = name
  }

  @Effect({
    ssr: true,
  })
  getCount(payload$: Observable<void>) {
    return payload$.pipe(
      mergeMap(() =>
        timer(20).pipe(
          map(() => this.getActions().setCount(1)),
          endWith(this.terminate()),
        ),
      ),
    )
  }

  @Effect({
    payloadGetter: (ctx: { url: string }, skip) => ctx.url || skip,
    skipFirstClientDispatch: false,
  })
  skippedEffect(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((name) =>
        timer(20).pipe(
          map(() => this.getActions().setName(name)),
          endWith(this.terminate()),
        ),
      ),
    )
  }
}
