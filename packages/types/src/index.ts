import { Subject, Observable, ReplaySubject } from 'rxjs'

export interface Action<Payload = unknown> {
  readonly type: string | symbol
  readonly payload: Payload
  readonly store: IStore<any>
}

export interface IStore<State> {
  readonly name: string
  readonly state$: ReplaySubject<State>
  readonly action$: Subject<Action>
  readonly state: State
  readonly ready: boolean

  setup: (defaultState: State) => void
  addEpic: (epic: Epic, first?: boolean) => () => void
  dispatch: (action: Action) => void
  log: (action: Action) => void
  dispose: () => void
}

export type Option<T> = T | undefined

export type Maybe<T> = T | null

export type Epic<T = unknown> = (action$: Observable<Action<T>>) => Observable<Action<T>>

export interface ConstructorOf<T> {
  new (...args: any[]): T
}
