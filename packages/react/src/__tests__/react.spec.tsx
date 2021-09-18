import 'reflect-metadata'

import { Module, EffectModule, Effect, ImmerReducer, Action } from '@sigi/core'
import { Draft } from 'immer'
import { useEffect, useState } from 'react'
import { create, act, ReactTestRenderer } from 'react-test-renderer'
import { Observable, timer } from 'rxjs'
import { mergeMap, map, endWith, switchMap } from 'rxjs/operators'
import * as Sinon from 'sinon'

import { useModuleState, useModule } from '../index.browser'

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
      mergeMap(() =>
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
      selector: (state) => {
        return state.count + localCount
      },
      dependencies: [localCount],
    })
    spy(state)
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
    expect(spy.callCount).toBe(2)
    expect(spy.args).toEqual([[0], [1]])
    expect(reactNode).toMatchSnapshot()
  })
})

describe('Hooks', () => {
  const resetStub = Sinon.stub()
  const setCountStub = Sinon.stub()
  const spy = Sinon.spy()
  const TestComponent = () => {
    const [state, dispatcher] = useModule(CountModel, {
      selector: (state) => state.count,
      dependencies: [],
    })
    spy()
    useEffect(() => {
      setCountStub.callsFake(() => {
        dispatcher.setCount(10)
      })
      resetStub.callsFake(() => {
        dispatcher.reset()
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <div>{state}</div>
  }
  let testWrapper!: ReactTestRenderer

  beforeEach(() => {
    act(() => {
      testWrapper = create(<TestComponent />)
    })
  })

  afterEach(() => {
    act(() => {
      resetStub()
      testWrapper.unmount()
    })
    spy.resetHistory()
    setCountStub.reset()
    resetStub.reset()
  })

  it('could reset state from dispatcher', () => {
    expect(testWrapper.root.findByType('div').children[0]).toBe('0')

    act(() => {
      setCountStub()
    })
    expect(testWrapper.root.findByType('div').children[0]).toBe('10')

    act(() => {
      resetStub()
    })
    expect(testWrapper.root.findByType('div').children[0]).toBe('0')
  })

  it('should not re-render if return state shallow equaled', () => {
    const fooSpy = Sinon.spy()
    const FooComponent = () => {
      const state = useModuleState(CountModel, {
        selector: () => ({ name: 'John Doe' }),
        dependencies: [],
      })
      fooSpy()
      return <div>{state.name}</div>
    }

    let fooWrapper!: ReactTestRenderer
    act(() => {
      fooWrapper = create(<FooComponent />)
    })

    expect(fooWrapper.root.findByType('div').children[0]).toBe('John Doe')
    act(() => {
      setCountStub()
    })
    expect(fooSpy.callCount).toBe(1)
    expect(spy.callCount).toBe(2)
    fooSpy.resetHistory()
  })

  it('should re-render if return state not pass custom equality function', () => {
    const fooSpy = Sinon.spy()
    const FooComponent = () => {
      const state = useModuleState(CountModel, {
        selector: () => ({ name: 'John Doe' }),
        dependencies: [],
        equalFn: (a, b) => a === b,
      })
      fooSpy()
      return <div>{state.name}</div>
    }

    let fooWrapper!: ReactTestRenderer
    act(() => {
      fooWrapper = create(<FooComponent />)
    })

    expect(fooWrapper.root.findByType('div').children[0]).toBe('John Doe')
    act(() => {
      setCountStub()
    })
    expect(fooSpy.callCount).toBe(2)
    expect(spy.callCount).toBe(2)
    fooSpy.resetHistory()
  })

  it('should run selector with new closure', () => {
    const setPlusCountStub = Sinon.stub()
    const FooComponent = () => {
      const [plusCount, setPlusCount] = useState(1)
      const plusOneCount = useModuleState(CountModel, {
        selector: (state) => plusCount + state.count,
        dependencies: [plusCount],
      })

      useEffect(() => {
        setPlusCountStub.callsFake(() => {
          setPlusCount(2)
        })
      }, [])

      return <div>{plusOneCount}</div>
    }

    let fooWrapper!: ReactTestRenderer
    act(() => {
      fooWrapper = create(<FooComponent />)
    })

    expect(fooWrapper.root.findByType('div').children[0]).toBe('1')
    act(() => {
      setPlusCountStub()
    })
    expect(fooWrapper.root.findByType('div').children[0]).toBe('2')

    act(() => {
      setCountStub()
    })
    expect(fooWrapper.root.findByType('div').children[0]).toBe('12')

    setPlusCountStub.reset()
  })

  it('Child <-> Parent scenario', () => {
    const name = 'tj'

    const ChildComponent = () => {
      const [state, dispatcher] = useModule(CountModel)
      useEffect(() => {
        dispatcher.setName(name)
      }, [dispatcher])

      return <span>{state.name}</span>
    }

    const FooComponent = () => {
      const state = useModuleState(CountModel)
      return (
        <div>
          {state.name}
          <ChildComponent />
        </div>
      )
    }

    let fooWrapper!: ReactTestRenderer
    act(() => {
      fooWrapper = create(<FooComponent />)
    })
    expect(fooWrapper.root.findByType('span').children[0]).toBe(name)
    expect(fooWrapper.root.findByType('div').children[0]).toBe(name)
  })
})
