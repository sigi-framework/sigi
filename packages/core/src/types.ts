/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { Action } from '@sigi/types'
import { Draft } from 'immer'
import { Observable } from 'rxjs'

import { EffectModule } from './module'

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

type UnpackPayload<F, S> =
  UnpackEffectPayload<F> extends never
    ? UnpackImmerReducerPayload<F, S> extends never
      ? UnpackReducerPayload<F, S> extends never
        ? UnpackDefineActionPayload<F> extends never
          ? never
          : UnpackDefineActionPayload<F>
        : UnpackReducerPayload<F, S>
      : UnpackImmerReducerPayload<F, S>
    : UnpackEffectPayload<F>

export type ActionOfEffectModule<M extends EffectModule<S>, S> = Omit<
  {
    [key in keyof M]: UnpackPayload<M[key], S> extends void ? () => void : (payload: UnpackPayload<M[key], S>) => void
  },
  keyof EffectModule<S>
> & {
  terminate: () => void
  reset: () => void
  noop: () => void
}

export type InstanceActionOfEffectModule<M extends EffectModule<S>, S> = Omit<
  {
    [key in keyof M]: (payload: UnpackPayload<M[key], S>) => Action<UnpackPayload<M[key], S>>
  },
  keyof EffectModule<S>
>

export type RetryActionOfEffectModule<M extends EffectModule<S>, S> = Omit<
  {
    [key in keyof M]: () => Action
  },
  keyof EffectModule<S>
>

export type ActionStreamOfEffectModule<M extends EffectModule<S>, S> = Omit<
  {
    [key in keyof M]: Observable<UnpackPayload<M[key], S>>
  },
  keyof EffectModule<S>
>

export type StateInEffectModule<M extends EffectModule<any>> = M extends EffectModule<infer S> ? S : never
