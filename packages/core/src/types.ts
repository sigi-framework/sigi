import { Observable } from 'rxjs'
import { Draft } from 'immer'
import { Action } from '@sigi/types'

import { Ayanami } from './ayanami'

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

type UnpackEffectPayload<Func> = Func extends (action$: Observable<infer Payload>) => Observable<Action>
  ? Payload
  : never

type UnpackReducerPayload<Func, S> = Func extends (state: S) => S
  ? void
  : Func extends (State: S, payload: infer Payload) => S
  ? Payload
  : never

type UnpackImmerReducerPayload<Func, S> = Func extends (state: Draft<S>) => void
  ? void
  : Func extends (state: Draft<S>, payload: infer Payload) => void
  ? Payload
  : never

type UnpackDefineActionPayload<OB> = OB extends Observable<infer P> ? P : never

type UnpackPayload<F, S> = UnpackEffectPayload<F> extends never
  ? UnpackImmerReducerPayload<F, S> extends never
    ? UnpackReducerPayload<F, S> extends never
      ? UnpackDefineActionPayload<F> extends never
        ? never
        : UnpackDefineActionPayload<F>
      : UnpackReducerPayload<F, S>
    : UnpackImmerReducerPayload<F, S>
  : UnpackEffectPayload<F>

export type ActionOfAyanami<M extends Ayanami<S>, S> = Omit<
  {
    [key in keyof M]: UnpackPayload<M[key], S> extends void ? () => void : (payload: UnpackPayload<M[key], S>) => void
  },
  keyof Ayanami<S>
>

export type InstanceActionOfAyanami<M extends Ayanami<S>, S> = Omit<
  {
    [key in keyof M]: (payload: UnpackPayload<M[key], S>) => Action<UnpackPayload<M[key], S>>
  },
  keyof Ayanami<S>
>

export type ActionStreamOfAyanami<M extends Ayanami<S>, S> = Omit<
  {
    [key in keyof M]: Observable<UnpackPayload<M[key], S>>
  },
  keyof Ayanami<S>
>
