import '@abraham/reflection'

import { Module, EffectModule, Effect, ImmerReducer, Action } from '@sigi/core'
import { Draft } from 'immer'
import { useEffect } from 'react'
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
  defaultState: CountState = { count: 0, name: 'John Doe' }

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
  const renderSpy = Sinon.spy()
  const TestComponent = () => {
    const state = useModuleState(CountModel)
    renderSpy()
    return (
      <div>
        {state.name}: {state.count}
      </div>
    )
  }

  afterEach(() => {
    renderSpy.resetHistory()
  })

  it('should render once while initial rendering', () => {
    const node = create(<TestComponent />)
    expect(renderSpy.callCount).toBe(1)
    expect(node).toMatchSnapshot()
  })
})

describe('Hooks', () => {
  const resetStore = Sinon.stub()
  const setCount = Sinon.stub()
  const renderSpy = Sinon.spy()
  const TestComponent = () => {
    const [state, dispatcher] = useModule(CountModel, {
      selector: (state) => {
        return state.count
      },
    })
    renderSpy()
    useEffect(() => {
      setCount.callsFake(() => {
        dispatcher.setCount(10)
      })
      resetStore.callsFake(() => {
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
      resetStore()
      testWrapper.unmount()
    })
    renderSpy.resetHistory()
    setCount.reset()
    resetStore.reset()
  })

  it('could reset state from dispatcher', () => {
    expect(testWrapper.root.findByType('div').children[0]).toBe('0')
    expect(renderSpy.callCount).toBe(1)

    act(() => {
      setCount()
    })
    expect(testWrapper.root.findByType('div').children[0]).toBe('10')
    expect(renderSpy.callCount).toBe(2)

    act(() => {
      resetStore()
    })
    expect(testWrapper.root.findByType('div').children[0]).toBe('0')
    expect(renderSpy.callCount).toBe(3)
  })

  it('should not re-render if return state shallow equaled', () => {
    const fooRenderSpy = Sinon.spy()
    const FooComponent = () => {
      const state = useModuleState(CountModel, {
        selector: (state) => ({ name: state.name }),
      })
      fooRenderSpy()
      return <div>{state.name}</div>
    }

    let fooWrapper!: ReactTestRenderer
    act(() => {
      fooWrapper = create(<FooComponent />)
    })

    expect(fooWrapper.root.findByType('div').children[0]).toBe('John Doe')
    act(() => {
      setCount()
    })
    expect(fooRenderSpy.callCount).toBe(1)
    expect(renderSpy.callCount).toBe(2)
    fooRenderSpy.resetHistory()
  })

  it('should re-render if return state not pass custom equality function', () => {
    const fooRenderSpy = Sinon.spy()
    const FooComponent = () => {
      const state = useModuleState(CountModel, {
        selector: (state) => ({ name: state.name }),
        equalFn: (a, b) => a === b,
      })
      fooRenderSpy()
      return <div>{state.name}</div>
    }

    let fooWrapper!: ReactTestRenderer
    act(() => {
      fooWrapper = create(<FooComponent />)
    })

    expect(fooWrapper.root.findByType('div').children[0]).toBe('John Doe')
    act(() => {
      setCount()
    })
    expect(fooRenderSpy.callCount).toBe(2)
    fooRenderSpy.resetHistory()
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
