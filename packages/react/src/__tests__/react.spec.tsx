import 'reflect-metadata'

import { Module, EffectModule, Effect, ImmerReducer, Action } from '@sigi/core'
import { Draft } from 'immer'
import React, { useState } from 'react'
import { create, act } from 'react-test-renderer'
import { Observable, timer } from 'rxjs'
import { flatMap, map, endWith, switchMap } from 'rxjs/operators'
import * as Sinon from 'sinon'

import { useModuleState } from '../index'

interface CountState {
  count: number
  name: string
}

@Module('CountModel')
class CountModel extends EffectModule<CountState> {
  defaultState = { count: 0, name: '' }

  @ImmerReducer()
  setCount(state: Draft<CountState>, count: number) {
    state.count = count
  }

  @ImmerReducer()
  setName(state: Draft<CountState>, name: string) {
    state.name = name
  }

  @Effect({
    ssr: true,
  })
  getCount(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      flatMap(() =>
        timer(20).pipe(
          map(() => this.getActions().setCount(1)),
          endWith(this.terminate()),
        ),
      ),
    )
  }

  @Effect({
    payloadGetter: (ctx: { url: string }, skip) => ctx.url || skip,
    skipFirstClientDispatch: false,
  })
  skippedEffect(payload$: Observable<string>): Observable<Action> {
    return payload$.pipe(
      switchMap((name) =>
        timer(20).pipe(
          map(() => this.getActions().setName(name)),
          endWith(this.terminate()),
        ),
      ),
    )
  }
}

describe('React components test', () => {
  const stub = Sinon.stub()
  const spy = Sinon.spy()
  const TestComponent = () => {
    const [localCount, setLocalCount] = useState(0)
    const state = useModuleState(CountModel, {
      selector: (state) => state.count + localCount,
      dependencies: [localCount],
    })
    spy()
    stub.callsFake(() => {
      setLocalCount(localCount + 1)
    })
    return <div onClick={stub}>{state}</div>
  }

  afterEach(() => {
    spy.resetHistory()
  })

  it('should render once while initial rendering', () => {
    create(<TestComponent />)
    expect(spy.callCount).toBe(1)
  })

  it('should render three times while change local state which in dependencies list', () => {
    const reactNode = create(<TestComponent />)
    act(() => stub())
    expect(spy.callCount).toBe(3)
    expect(reactNode).toMatchSnapshot()
  })
})
