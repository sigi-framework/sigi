import 'reflect-metadata'
import { rootInjector } from '@sigi/di'
import { Observable } from 'rxjs'
import { delay, map } from 'rxjs/operators'
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
  })

  it('should be able to dispatch actions from the other module', () => {
    const asyncTimeToDelay = 2000
    const timer = Sinon.useFakeTimers()
    @Module('Foo')
    class FooModule extends EffectModule<{ foo: string }> {
      defaultState = {
        foo: '1',
      }

      @Reducer()
      set(state: { foo: string }, payload: string) {
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
    const fooStore = fooModule.setupStore()
    const barModule = rootInjector.getInstance(BarModule)
    const barStore = barModule.setupStore()

    const payload = 'whatever'
    const action = barModule.getActions().asyncSetFoo(payload)
    expect(action.payload).toBe(payload)
    fooStore.dispatch(action)
    timer.tick(asyncTimeToDelay)
    expect(fooModule.state.foo).toBe(payload)

    fooStore.dispose()
    barStore.dispose()
    timer.restore()
    rootInjector.reset()
  })
})
