import { IStore, Epic, Action } from '@sigi/types'
import { BehaviorSubject, ReplaySubject, Subject, Subscription, identity } from 'rxjs'
import { share, switchMap } from 'rxjs/operators'

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
  private readonly epic$: BehaviorSubject<Epic>
  private actionSub = new Subscription()
  private readonly stateSub = new Subscription()
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
    this.epic$ = new BehaviorSubject(epic)
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

    this.subscribeAction()
    this.stateSub.add(
      this.state$.subscribe((state) => {
        this.internalState = state
      }),
    )
    this.state$.next(this.state)
    this.log(this.initAction)
    this.isReady = true
  }

  /**
   * @param combineEpic {(combineEpic: import('@sigi/types').Epic) => import('@sigi/types').Epic}
   * accept `combineEpic` factory to produce new `Epic`
   * The streams on old `Epic` will be switched.
   */
  addEpic(combineEpic: (prevEpic: Epic) => Epic) {
    const { epic$ } = this
    const prevEpic = epic$.getValue()
    epic$.next(
      combineEpic((action$) => {
        if (action$ instanceof Subject) {
          return prevEpic(action$)
        } else {
          return prevEpic(action$.pipe(share()))
        }
      }),
    )

    return () => {
      this.epic$.next(prevEpic)
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
    this.stateSub.unsubscribe()
    this.actionSub.unsubscribe()
    this.action$.complete()
    this.state$.complete()
    this.epic$.complete()
    this.action$.unsubscribe()
    this.epic$.unsubscribe()
  }

  private subscribeAction() {
    this.actionSub = this.epic$.pipe(switchMap((epic) => epic(this.action$))).subscribe({
      next: (action) => {
        try {
          this.dispatch(action)
        } catch (e) {
          this.action$.error(e)
        }
      },
      error: (e) => {
        if (!this.action$.closed) {
          this.action$.error(e)
        }
      },
    })
  }
}
