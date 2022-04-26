import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Injectable } from '@sigi/di'
import { Draft } from 'immer'
import { endWith, map, mergeMap, Observable, of, switchMap } from 'rxjs'

@Injectable()
export class Service {
  getName() {
    return of('client service')
  }
}

interface State {
  count: number
  name: string
}

@Module('ServiceModule')
export class ServiceModule extends EffectModule<State> {
  readonly defaultState = { count: 0, name: '' }

  constructor(public readonly service: Service) {
    super()
  }

  @ImmerReducer()
  setName(state: Draft<State>, name: string) {
    state.name = name
  }

  @Effect({
    ssr: true,
  })
  setNameEffect(payload$: Observable<void>) {
    return payload$.pipe(
      switchMap(() =>
        this.service.getName().pipe(
          map((name) => this.getActions().setName(name)),
          endWith(this.terminate()),
        ),
      ),
    )
  }

  @Effect({
    payloadGetter: (ctx: { failure: boolean }, skip) => {
      if (!ctx.failure) {
        return skip
      }
      return 1
    },
  })
  setNameWithFailure(payload$: Observable<number | undefined>) {
    return payload$.pipe(
      mergeMap((p) => {
        if (p) {
          return of(this.retryOnClient().setNameWithFailure(), this.terminate())
        }
        return of(this.getActions().setName('From retry'))
      }),
    )
  }
}
