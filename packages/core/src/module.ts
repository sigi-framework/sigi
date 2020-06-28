import { Action, Epic } from '@sigi/types'
import produce, { Draft } from 'immer'
import { Observable, merge } from 'rxjs'
import { map, filter, skip, publish, ignoreElements } from 'rxjs/operators'

import { hmrEnabled, hmrInstanceCache } from './hmr'
import { getDecoratedActions, getActionsToSkip } from './metadata'
import { Store, Reducer } from './store'
import {
  NOOP_ACTION_TYPE_SYMBOL,
  GLOBAL_KEY_SYMBOL,
  TERMINATE_ACTION_TYPE_SYMBOL,
  RESET_ACTION_TYPE_SYMBOL,
} from './symbols'
import { InstanceActionOfEffectModule, ActionStreamOfEffectModule } from './types'

type Effect<T> = (payload$: Observable<T>) => Observable<Action<unknown>>
type ImmerReducer<S, T> = (prevState: Draft<S>, payload: T) => void

const _globalThis =
  /* istanbul ignore next */ typeof globalThis === 'undefined'
    ? /* istanbul ignore next */ typeof window === 'undefined'
      ? global
      : window
    : globalThis

export abstract class EffectModule<S> {
  abstract readonly defaultState: S

  readonly moduleName!: string
  // @internal
  readonly store: Store<S>

  // give them `any` type and refer the right type in getters
  private readonly actions: any = {}
  private readonly actionStreams: any = {}
  private actionNames: string[] = []
  private restoredFromSSR = false

  get state$() {
    return this.store.state$
  }

  get action$() {
    return this.store.action$
  }

  get state() {
    return this.store.state
  }

  constructor() {
    const epic = this.combineEffects()
    const reducer = this.combineReducers()
    const definedActions = this.combineDefineActions()

    this.store = new Store<S>(this.moduleName, reducer, epic)

    // properties decorated by @DefinedAction() need to be Observable
    definedActions.forEach((name) => {
      ;(this as any)[name] = this.store.action$.pipe(
        filter(({ type }) => type === name),
        map(({ payload }) => payload),
      )
    })

    // assemble actions and action steams for `getAction()` and `getAction$`
    this.actionNames.forEach((name) => {
      // action getters
      this.actions[name] = (payload: unknown) => ({ type: name, payload, store: this.store })
      // action stream getters
      this.actionStreams[name] = this.store.action$.pipe(
        filter(({ type }) => type === name),
        map(({ payload }) => payload),
      )
    })
  }

  /**
   * Get all action dispatchers.
   *
   * @param this
   */
  getActions<M extends EffectModule<S>>(
    this: M,
  ): M extends EffectModule<infer State> ? InstanceActionOfEffectModule<M, State> : never {
    return this.actions
  }

  /**
   * Get all action steams.
   *
   * @param this
   */
  getAction$<M extends EffectModule<S>>(
    this: M,
  ): M extends EffectModule<infer State> ? ActionStreamOfEffectModule<M, State> : ActionStreamOfEffectModule<M, S> {
    return this.actionStreams
  }

  /**
   * Setup the background store and get ready to use.
   *
   * We can't do this in constructor because defaultState is a abstract property defined by inheritors.
   * It's undefined in parent constructor
   */
  setupStore(): Store<S> {
    if (!this.store.ready) {
      this.store.setup(this.getDefaultState())
    }
    return this.store
  }

  /**
   * Get a noop action.
   *
   * Noop action will be ignore internally and even no log.
   */
  protected noop(): Action<null> {
    return { type: NOOP_ACTION_TYPE_SYMBOL, payload: null, store: this.store }
  }

  /**
   * Get a noop action.
   *
   * Noop action will be ignore internally and even no log.
   *
   * @deprecated use `this.noop()` instead
   */
  protected createNoopAction(): Action<null> {
    return this.noop()
  }

  /**
   * Get a terminate action.
   *
   * because every effect is action steam, we can't know when a effect finished one run.
   *
   * emit a terminate action can let us know.
   */
  protected terminate(): Action<null> {
    return { type: TERMINATE_ACTION_TYPE_SYMBOL, payload: null, store: this.store }
  }

  /**
   * Get a reset action.
   *
   * Used to reset store to default state.
   */
  protected reset(): Action<null> {
    return { type: RESET_ACTION_TYPE_SYMBOL, payload: null, store: this.store }
  }

  private getDefaultState(): S {
    return this.tryReadHmrState() ?? this.tryReadSSRState() ?? this.defaultState
  }

  private tryReadSSRState(): S | undefined {
    const ssrCache = (_globalThis as any)[Symbol.for(Symbol.keyFor(GLOBAL_KEY_SYMBOL)!)]
    if (ssrCache?.[this.moduleName]) {
      this.restoredFromSSR = true
      return ssrCache[this.moduleName]
    }
  }

  private tryReadHmrState(): S | undefined {
    if (hmrEnabled) {
      const hmrCache = hmrInstanceCache.get(this.moduleName)
      if (hmrCache) {
        const cachedState = hmrCache.state
        hmrCache.dispose()
        return cachedState
      }
    }
  }

  private combineEffects(): Epic {
    const effectKeys = getDecoratedActions(this.constructor.prototype, 'Effect')
    if (!effectKeys || effectKeys.length === 0) {
      return (action$) => action$.pipe(ignoreElements())
    }

    this.actionNames = [...this.actionNames, ...effectKeys]

    return (action$: Observable<Action>) => {
      const actionsToSkip = this.restoredFromSSR ? getActionsToSkip(this.constructor.prototype) : undefined

      // use multicast to avoid action steam get forked.
      return action$.pipe(
        publish((multicast$) =>
          merge(
            ...effectKeys.map((name) => {
              const effect: Effect<unknown> = (this as any)[name]
              const payload$ = multicast$.pipe(
                filter(({ type }) => type === name),
                skip(actionsToSkip?.includes(name) ? 1 : 0),
                map(({ payload }) => payload),
              )
              return effect.call(this, payload$)
            }),
          ),
        ),
      )
    }
  }

  private combineReducers(): Reducer<S, Action> {
    const reducerKeys = getDecoratedActions(this.constructor.prototype, 'Reducer', [])!
    const immerReducerKeys = getDecoratedActions(this.constructor.prototype, 'ImmerReducer', [])!

    this.actionNames = [...this.actionNames, ...reducerKeys, ...immerReducerKeys]

    const immerReducers = immerReducerKeys.reduce((acc, property) => {
      acc[property] = (this as any)[property].bind(this)
      return acc
    }, {} as { [index: string]: ImmerReducer<S, unknown> })
    const reducers = reducerKeys.reduce((acc, property) => {
      acc[property] = (this as any)[property].bind(this)
      return acc
    }, {} as { [index: string]: Reducer<S, unknown> })

    return (prevState, action) => {
      const { type } = action
      if (typeof type === 'string') {
        if (reducers[type]) {
          return reducers[type](prevState, action.payload)
        } else if (immerReducers[type]) {
          return produce(prevState, (draft: Draft<S>) => immerReducers[type](draft, action.payload))
        }
      } else if (type === RESET_ACTION_TYPE_SYMBOL) {
        return this.defaultState
      }
      return prevState
    }
  }

  private combineDefineActions() {
    const defineActionKeys = getDecoratedActions(this.constructor.prototype, 'DefineAction', [])!
    this.actionNames = [...this.actionNames, ...defineActionKeys]
    return defineActionKeys
  }
}
