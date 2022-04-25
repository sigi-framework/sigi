/* eslint-disable sonarjs/no-identical-functions */

import '@abraham/reflection'
import { rootInjector } from '@sigi/di'
import { Observable } from 'rxjs'
import { delay, map, tap } from 'rxjs/operators'
import * as Sinon from 'sinon'

import { Reducer, Effect } from '../decorators'
import { EffectModule } from '../module'
import { Module } from '../module.decorator'
import { Store } from '../store'

describe('Smoking tests', () => {
  it('Module should be able to work without effects', () => {
    const store = new Store('store', (state: { name: string }, action) => {
      if (action.type === 'foo') {
        return { ...state, name: action.payload as string }
      }
      return state
    })
    store.setup({ name: 'bar' })

    const action = {
      type: 'foo',
      payload: 'foo',
      store,
    }
    store.dispatch(action)
    expect(store.state.name).toBe(action.payload)

    store.dispose()
  })

  it('should be able to dispatch actions from the other module', () => {
    const asyncTimeToDelay = 2000
    const timer = Sinon.useFakeTimers()
    const spy = Sinon.spy()
    @Module('Foo')
    class FooModule extends EffectModule<{ foo: string }> {
      defaultState = {
        foo: '1',
      }

      @Reducer()
      set(state: { foo: string }, payload: string) {
        spy(state, payload)
        return { ...state, foo: payload }
      }
    }

    @Module('Bar')
    class BarModule extends EffectModule<Record<string, unknown>> {
      defaultState = {}

      constructor(private readonly fooModule: FooModule) {
        super()
      }

      @Effect()
      asyncSetFoo(payload$: Observable<string>) {
        return payload$.pipe(
          delay(asyncTimeToDelay),
          map((payload) => this.fooModule.getActions().set(payload)),
        )
      }
    }

    const fooModule = rootInjector.getInstance(FooModule)
    const fooStore = fooModule.store
    const barModule = rootInjector.getInstance(BarModule)
    const barStore = barModule.store

    const payload = 'whatever'
    const action = barModule.getActions().asyncSetFoo(payload)
    expect(action.payload).toBe(payload)
    fooStore.dispatch(action)
    timer.tick(asyncTimeToDelay)
    expect(fooModule.state.foo).toBe(payload)

    const [[fooState, fooPayload]] = spy.args
    expect(fooState).not.toBe(null)
    expect(fooPayload).toBe(payload)

    fooStore.dispose()
    barStore.dispose()
    timer.restore()
    rootInjector.reset()
  })

  it('should skip all effects restored from persisted state', () => {
    type State = { foo: string; bar: number }
    const staticState = { foo: 'foo', bar: 42 }
    global['SIGI_STATE'] = {
      SSRPersistModule: staticState,
    }
    const spy = Sinon.spy()
    @Module('SSRPersistModule')
    class SSRPersistModule extends EffectModule<State> {
      defaultState = {
        foo: '1',
        bar: 2,
      }

      @Reducer()
      set(state: State, payload: string | number) {
        if (typeof payload === 'string') {
          return { ...state, foo: payload }
        } else {
          return { ...state, bar: payload }
        }
      }

      @Effect({
        payloadGetter: () => '2',
      })
      setFoo(payload$: Observable<string>) {
        return payload$.pipe(
          tap(spy),
          map((payload) => this.getActions().set(payload)),
        )
      }

      @Effect({
        payloadGetter: () => 3,
      })
      setBar(payload$: Observable<number>) {
        return payload$.pipe(
          tap(spy),
          map((payload) => this.getActions().set(payload)),
        )
      }
    }

    const module = rootInjector.getInstance(SSRPersistModule)
    module.dispatchers.setFoo(staticState.foo + 1)
    module.dispatchers.setBar(staticState.bar + 1)
    expect(spy.callCount).toBe(0)
    expect(module.state.foo).toBe(staticState.foo)
    expect(module.state.bar).toBe(staticState.bar)
    module.store.dispose()
  })
})
