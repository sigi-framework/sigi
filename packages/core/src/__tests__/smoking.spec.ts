import 'reflect-metadata'
import { rootInjector } from '@sigi/di'
import * as Sinon from 'sinon'
import { empty, Observable } from 'rxjs'
import { delay, map } from 'rxjs/operators'

import { createState } from '../state'
import { EffectModule } from '../module'
import { Reducer, Effect } from '../decorators'
import { Module } from '../module.decorator'

describe('Smoking tests', () => {
  it('Module should be able to work without effects', () => {
    const { stateCreator } = createState(
      (state: { name: string }, action) => {
        if (action.type === 'foo') {
          return { ...state, name: action.payload as string }
        }
        return state
      },
      () => empty(),
    )

    const state = stateCreator({ name: 'bar' })
    const action = {
      type: 'foo',
      payload: 'foo',
      state,
    }
    state.dispatch(action)
    expect(state.getState().name).toBe(action.payload)
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
    class BarModule extends EffectModule<{}> {
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

    const fooModuleState = rootInjector.getInstance(FooModule)
    const barModuleState = rootInjector.getInstance(BarModule)
    const fooState = fooModuleState.createState()
    const barState = barModuleState.createState()

    const payload = 'whatever'
    const action = barModuleState.getActions().asyncSetFoo(payload)
    expect(action.payload).toBe(payload)
    barState.dispatch(action)
    timer.tick(asyncTimeToDelay)
    expect(fooState.getState().foo).toBe(payload)
    timer.restore()
    rootInjector.reset()
  })
})
