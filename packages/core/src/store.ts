import { IStore, Epic, Action } from '@sigi/types'
import {
  Observable,
  Subject,
  ReplaySubject,
  Subscription,
  identity,
  MonoTypeOperatorFunction,
  of,
  throwError,
} from 'rxjs'
import { mergeMap, catchError } from 'rxjs/operators'

import { logStoreAction } from './logger'
import { INIT_ACTION_TYPE_SYMBOL, TERMINATE_ACTION_TYPE_SYMBOL, NOOP_ACTION_TYPE_SYMBOL } from './symbols'

export type Reducer<S, T> = (prevState: S, Action: T) => S

export class Store<S> implements IStore<S> {
  readonly state$ = new ReplaySubject<S>(1)
  readonly action$ = new Subject<Action>()
  readonly name: string

  private isReady = false
  private internalState!: S
  private readonly reducer: Reducer<S, Action>
  private epics: Epic[] = []
  private readonly subscription = new Subscription()
  private readonly initAction: Action<null> = {
    type: INIT_ACTION_TYPE_SYMBOL,
    payload: null,
    store: this,
  }

  get state() {
    return this.internalState
  }

  get ready() {
    return this.isReady
  }

  constructor(name: string, reducer: Reducer<S, Action> = identity, epic: Epic = identity) {
    this.name = name
    this.reducer = reducer
    this.addEpic(epic)
  }

  /**
   * Setup store
   *
   * Subscription on state and action starts.
   *
   * @param defaultState
   */
  setup(defaultState: S) {
    this.internalState = defaultState

    this.subscription.add(
      this.action$.pipe(this.walkThroughEpics()).subscribe({
        next: (action) => {
          try {
            this.dispatch(action)
          } catch (e) {
            this.action$.error(e)
          }
        },
      }),
    )

    this.subscription.add(
      this.state$.subscribe((state) => {
        this.internalState = state
      }),
    )

    this.state$.next(this.state)
    this.log(this.initAction)
    this.isReady = true
  }

  /**
   * Epics are array of epic that would be invoked the same order as their existence.
   *
   * Make sure new adding epics piped out a multicast steam otherwise the previous epic will be trigged multi times.
   *
   * Their is a default `effects epic` which will receive all actions dispatched but only `effects actions` steamed out,
   * so if you want to spy on all actions, make sure put new epic before effects epic by passing second argument with `true`
   *
   * @param epic
   * @param first `true` to unshift given epic to epics array and `false` to append
   */
  addEpic(epic: Epic, first = false) {
    if (first) {
      this.epics.unshift(epic)
    } else {
      this.epics.push(epic)
    }

    return () => {
      this.epics = this.epics.filter((e) => e !== epic)
    }
  }

  dispatch(action: Action) {
    // ignore noop action
    if (action.type === NOOP_ACTION_TYPE_SYMBOL) {
      return
    }

    if (action.store !== this) {
      action.store.dispatch(action)
      return
    }

    const prevState = this.internalState
    const newState = this.reducer(prevState, action)
    if (newState !== prevState) {
      this.state$.next(newState)
    }
    this.log(action)
    this.action$.next(action)
  }

  log(action: Action) {
    if (action.type !== TERMINATE_ACTION_TYPE_SYMBOL) {
      logStoreAction(action)
    }
  }

  dispose() {
    this.action$.complete()
    this.state$.complete()
    this.subscription.unsubscribe()
  }

  private walkThroughEpics(): MonoTypeOperatorFunction<Action> {
    const applyEpics = (source$: Observable<Action>) => {
      return this.epics.reduce((prev$, epic) => epic(prev$), source$)
    }

    return (action$: Observable<Action>) => {
      return action$.pipe(
        mergeMap((action) => {
          return applyEpics(of(action))
        }),
        catchError((e) => {
          return applyEpics(throwError(e))
        }),
      )
    }
  }
}
