import { Action, Epic, Store, StoreCreator } from '@sigi/types'
import produce, { Draft } from 'immer'
import { Reducer } from 'react'
import { Observable, merge, identity } from 'rxjs'
import { map, filter, publish, refCount, skip } from 'rxjs/operators'

import { GLOBAL_KEY, ACTION_TO_SKIP_KEY, SSR_LOADED_KEY, INIT_ACTION_TYPE } from './constants'
import { logStoreAction } from './logger'
import { createStore } from './state'
import {
  EFFECT_DECORATOR_SYMBOL,
  REDUCER_DECORATOR_SYMBOL,
  IMMER_REDUCER_DECORATOR_SYMBOL,
  DEFINE_ACTION_DECORATOR_SYMBOL,
} from './symbols'
import { InstanceActionOfEffectModule, ActionStreamOfEffectModule } from './types'

type Effect<T> = (payload$: Observable<T>) => Observable<Action<unknown>>

const _globalThis =
  /* istanbul ignore next */ typeof globalThis === 'undefined'
    ? /* istanbul ignore next */ typeof window === 'undefined'
      ? global
      : window
    : globalThis

type ImmerReducer<S, T> = (prevState: Draft<S>, payload: T) => void

// cast to string to match the shape of action
const NOOP_ACTION_TYPE = (Symbol('NOOP_ACTION') as unknown) as string

const effectNameSymbol: unique symbol = Symbol('effect-name')

export abstract class EffectModule<S> {
  abstract readonly defaultState: S

  readonly moduleName!: string

  // @internal
  readonly _actionKeys: string[] = []

  // @internal
  store: Store<S> | null = null

  state$: Observable<S>

  private readonly setupStore!: StoreCreator<S>

  private readonly actions!: any

  private readonly actionStreams!: any

  private defineActionKeys!: string[]

  private readonly action$: Observable<Action<unknown>>

  private readonly effect: Epic<unknown>
  private readonly reducer: Reducer<S, Action<unknown>>

  constructor() {
    this.effect = this.combineEffects()
    this.reducer = this.combineReducers()

    const { setup, action$, state$ } = createStore(this.reducer, this.effect)
    this.setupStore = setup
    this.action$ = action$
    this.state$ = state$

    this.combineDefineActions()

    this.actions = this._actionKeys.reduce((acc, key) => {
      acc[key] = (payload: unknown) => {
        const action = {
          type: key,
          payload,
        }
        Object.defineProperty(action, 'store', {
          value: this.store,
          enumerable: false,
          configurable: false,
          writable: false,
        })
        return action
      }
      return acc
    }, Object.create(null))

    this.actionStreams = this._actionKeys.reduce((acc, key) => {
      acc[key] = this.action$.pipe(
        filter(({ type }) => type === key),
        map(({ payload }) => payload),
      )

      return acc
    }, {} as any)
  }

  createStore(middleware: (effect$: Observable<Action<unknown>>) => Observable<Action<unknown>> = identity) {
    if (this.store) return this.store
    const ssrCache = (_globalThis as any)[Symbol.for(Symbol.keyFor(GLOBAL_KEY)!)]
    let loadFromSSR = false
    let preloadState: S | undefined
    if (ssrCache?.[this.moduleName]) {
      preloadState = ssrCache[this.moduleName]
      loadFromSSR = true
    }
    this.store = this.setupStore(preloadState ?? this.defaultState, middleware, loadFromSSR)
    Reflect.defineMetadata(SSR_LOADED_KEY, loadFromSSR, this.store)
    if (process.env.NODE_ENV !== 'production') {
      Object.defineProperty(this.store, 'name', {
        value: this.moduleName,
        configurable: false,
        enumerable: false,
        writable: false,
      })
      logStoreAction({
        type: INIT_ACTION_TYPE,
        store: this.store,
        payload: null,
      })
    }
    return this.store
  }

  getActions<M extends EffectModule<S>>(
    this: M,
  ): M extends EffectModule<infer State> ? InstanceActionOfEffectModule<M, State> : never {
    return this.actions
  }

  getAction$<M extends EffectModule<S>>(
    this: M,
  ): M extends EffectModule<infer State> ? ActionStreamOfEffectModule<M, State> : ActionStreamOfEffectModule<M, S> {
    return this.actionStreams
  }

  protected createNoopAction(): Action<null> {
    return {
      type: NOOP_ACTION_TYPE,
      payload: null,
      state: this.store!,
    }
  }

  private combineEffects() {
    const effectKeys = (Reflect.getMetadata(EFFECT_DECORATOR_SYMBOL, this.constructor) as string[]) || []
    this._actionKeys.push(...effectKeys)
    const effects: Effect<unknown>[] = effectKeys.map((property) => {
      const effect = (this as any)[property].bind(this)
      Object.defineProperty(effect, effectNameSymbol, {
        value: property,
        enumerable: false,
        configurable: false,
        writable: false,
      })
      return effect
    })

    return (action$: Observable<Action<unknown>>, loadFromSSR: boolean) => {
      const actionsToSkip: Set<string> | undefined = Reflect.getMetadata(ACTION_TO_SKIP_KEY, this.constructor.prototype)
      return merge(
        ...effects.map((effect) => {
          const effectActionType: string = (effect as any)[effectNameSymbol]
          const skipCount = loadFromSSR && actionsToSkip && actionsToSkip.has(effectActionType) ? 1 : 0
          const payload$ = action$.pipe(
            filter(({ type }) => type === effectActionType),
            skip(skipCount),
            map(({ payload }) => payload),
          )
          return effect(payload$)
        }),
      )
    }
  }

  private combineReducers(): Reducer<S, Action<unknown>> {
    const reducerKeys: string[] = (Reflect.getMetadata(REDUCER_DECORATOR_SYMBOL, this.constructor) as string[]) || []
    const reducers = reducerKeys.reduce((acc, property) => {
      acc[property] = (this as any)[property].bind(this)
      return acc
    }, {} as { [index: string]: Reducer<S, unknown> })
    const immerReducerKeys = (Reflect.getMetadata(IMMER_REDUCER_DECORATOR_SYMBOL, this.constructor) as string[]) || []
    this._actionKeys.push(...reducerKeys, ...immerReducerKeys)
    const immerReducers = immerReducerKeys.reduce((acc, property) => {
      acc[property] = (this as any)[property].bind(this)
      return acc
    }, {} as { [index: string]: ImmerReducer<S, unknown> })

    return (prevState, action) => {
      const { type } = action
      if (typeof type === 'string') {
        if (reducers[type]) {
          return reducers[type](prevState, action.payload)
        } else if (immerReducers[type]) {
          return produce(prevState, (draft: Draft<S>) => immerReducers[type](draft, action.payload))
        }
      }
      return prevState
    }
  }

  private combineDefineActions() {
    this.defineActionKeys = (Reflect.getMetadata(DEFINE_ACTION_DECORATOR_SYMBOL, this.constructor) as string[]) || []

    this._actionKeys.push(...this.defineActionKeys)

    for (const actionType of this.defineActionKeys) {
      ;(this as any)[actionType] = this.action$.pipe(
        filter(({ type }) => type === actionType),
        map(({ payload }) => payload),
        publish(),
        refCount(),
      )
    }
  }
}
