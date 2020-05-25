import { Subject, Observable } from 'rxjs'

export type Store<S> = {
  getState: () => S
  dispatch: <T>(action: Action<T>) => void
  // @internal
  state$: Subject<S>
  subscribeAction: (observer: (action: Action<unknown>) => void) => () => void
  unsubscribe: () => void
}

export interface Action<T = unknown> {
  readonly type: string | symbol
  readonly payload: T
}

export type Option<T> = T | undefined

export type Maybe<T> = T | null

export type Epic<T> = (action$: Observable<Action<T>>, loadFromSSR: boolean) => Observable<Action<unknown>>

export type StoreCreator<S> = {
  (
    defaultState: S,
    middleware?: (effect$: Observable<Action<unknown>>) => Observable<Action<unknown>>,
    loadFromSSR?: boolean,
  ): // @internal
  Store<S>
}

export interface ConstructorOf<T> {
  new (...args: any[]): T
}
