/**
 * @jest-environment jsdom
 */

import '@abraham/reflection'

import { Module, EffectModule, Effect, ImmerReducer, Action } from '@sigi/core'
import { Draft } from 'immer'
import { useEffect } from 'react'
import { render, act, type RenderResult } from '@testing-library/react'
import { Observable, timer } from 'rxjs'
import { mergeMap, map, endWith, switchMap } from 'rxjs/operators'

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
  const mockRender = jest.fn()
  const TestComponent = () => {
    const state = useModuleState(CountModel)
    mockRender()
    return (
      <div>
        {state.name}: {state.count}
      </div>
    )
  }

  afterEach(() => {
    mockRender.mockReset()
  })

  it('should render once while initial rendering', () => {
    const node = render(<TestComponent />)
    expect(mockRender).toHaveBeenCalledTimes(1)
    expect(node.baseElement.innerHTML).toMatchSnapshot()
  })
})

describe('Hooks', () => {
  const resetStore = jest.fn()
  const setCount = jest.fn()
  const mockRender = jest.fn()
  const TestComponent = () => {
    const [state, dispatcher] = useModule(CountModel, {
      selector: (state) => {
        return state.count
      },
    })
    mockRender()
    useEffect(() => {
      setCount.mockImplementation(() => {
        dispatcher.setCount(10)
      })
      resetStore.mockImplementation(() => {
        dispatcher.reset()
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <div>{state}</div>
  }
  let testWrapper!: RenderResult

  beforeEach(() => {
    act(() => {
      testWrapper = render(<TestComponent />)
    })
  })

  afterEach(() => {
    act(() => {
      resetStore()
      testWrapper.unmount()
    })
    mockRender.mockReset()
    setCount.mockReset()
    resetStore.mockReset()
  })

  it('could reset state from dispatcher', () => {
    expect(testWrapper.container.querySelector('div')?.textContent).toBe('0')
    expect(mockRender).toHaveBeenCalledTimes(1)

    act(() => {
      setCount()
    })
    expect(testWrapper.container.querySelector('div')?.textContent).toBe('10')
    expect(mockRender).toHaveBeenCalledTimes(2)

    act(() => {
      resetStore()
    })
    expect(testWrapper.container.querySelector('div')?.textContent).toBe('0')
    expect(mockRender).toHaveBeenCalledTimes(3)
  })

  it('should not re-render if return state shallow equaled', () => {
    const fooRenderSpy = jest.fn()
    const FooComponent = () => {
      const state = useModuleState(CountModel, {
        selector: (state) => ({ name: state.name }),
      })
      fooRenderSpy()
      return <div>{state.name}</div>
    }

    let fooWrapper!: RenderResult
    act(() => {
      fooWrapper = render(<FooComponent />)
    })
    expect(fooWrapper.container.querySelector('div')?.textContent).toBe('John Doe')
    act(() => {
      setCount()
    })
    expect(fooRenderSpy).toHaveBeenCalledTimes(1)
    expect(mockRender).toHaveBeenCalledTimes(2)
    fooRenderSpy.mockReset()
  })

  it('should re-render if return state not pass custom equality function', () => {
    const fooRenderSpy = jest.fn()
    const FooComponent = () => {
      const state = useModuleState(CountModel, {
        selector: (state) => ({ name: state.name }),
        equalFn: (a, b) => a === b,
      })
      fooRenderSpy()
      return <div>{state.name}</div>
    }

    let fooWrapper!: RenderResult
    act(() => {
      fooWrapper = render(<FooComponent />)
    })

    expect(fooWrapper.container.querySelector('div')?.textContent).toBe('John Doe')
    act(() => {
      setCount()
    })
    expect(fooRenderSpy).toHaveBeenCalledTimes(2)
    fooRenderSpy.mockReset()
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

    let fooWrapper!: RenderResult
    act(() => {
      fooWrapper = render(<FooComponent />)
    })
    expect(fooWrapper.container.querySelector('span')?.textContent).toBe(name)
    expect(fooWrapper.container.querySelector('div')?.childNodes.item(0).textContent).toBe(name)
  })
})
