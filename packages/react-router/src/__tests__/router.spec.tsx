/**
 * @jest-environment jsdom
 */

import '@abraham/reflection'
import { EffectModule, Effect, Module, Reducer, Action, DefineAction } from '@sigi/core'
import { useInstance } from '@sigi/react'
import { Test, SigiTestModule, SigiTestStub } from '@sigi/testing'
import { History, createMemoryHistory } from 'history'
import { render, act, type RenderResult } from '@testing-library/react'
import { Observable, Subject } from 'rxjs'
import { map, exhaustMap, takeUntil, switchMap } from 'rxjs/operators'

import { RouterModule, RouterChanged, HistoryProvide, Router$Provide } from '../browser.module'
import { SigiRouterProvider } from '../router-provider'

interface TestState {
  event: RouterChanged | null
}

@Module('sigi-router-testing')
class TestModule extends EffectModule<TestState> {
  defaultState = {
    event: null,
  }

  @DefineAction()
  stopListen$!: Observable<void>

  constructor(private readonly routerModule: RouterModule) {
    super()
  }

  @Effect()
  goHome(payload$: Observable<void>) {
    return payload$.pipe(map(() => this.routerModule.push('/home')))
  }

  @Effect()
  goBack(payload$: Observable<void>) {
    return payload$.pipe(map(() => this.routerModule.goBack()))
  }

  @Effect()
  replace(payload$: Observable<string>) {
    return payload$.pipe(map((path) => this.routerModule.replace(path)))
  }

  @Effect()
  go(payload$: Observable<number>) {
    return payload$.pipe(map((depth) => this.routerModule.go(depth)))
  }

  @Effect()
  goForward(payload$: Observable<void>) {
    return payload$.pipe(map(() => this.routerModule.goForward()))
  }

  @Effect()
  listen(payload$: Observable<void>) {
    return payload$.pipe(
      switchMap(() =>
        this.routerModule.router$.pipe(
          map((routerEvent) => {
            return this.getActions().setRouterEvent(routerEvent)
          }),
        ),
      ),
    )
  }

  @Effect()
  listenWithStopSignal(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      exhaustMap(() =>
        this.routerModule.router$.pipe(
          map((routerEvent) => {
            return this.getActions().setRouterEvent(routerEvent)
          }),
          takeUntil(this.getAction$().stopListen$),
        ),
      ),
    )
  }

  @Reducer()
  setRouterEvent(state: TestState, event: RouterChanged) {
    return { ...state, event }
  }
}

describe('Router module spec', () => {
  const history: History = createMemoryHistory()
  let testStub: SigiTestStub<TestModule, TestState>
  let router$: Subject<RouterChanged>
  let teardown: () => void
  beforeEach(() => {
    router$ = new Subject()
    const testingModule = Test.createTestingModule({
      TestModule: SigiTestModule,
      providers: [
        {
          provide: HistoryProvide.provide,
          useValue: history,
        },
        {
          provide: Router$Provide.provide,
          useValue: router$,
        },
      ],
    }).compile()

    teardown = history.listen((update) => {
      router$.next(update)
    })

    testStub = testingModule.getTestingStub(TestModule)
  })

  afterEach(() => {
    teardown()
    router$.unsubscribe()
  })

  it('should invoke push', () => {
    const pushSpy = jest.spyOn(history, 'push')
    testStub.dispatcher.goHome()
    expect(pushSpy).toHaveBeenCalledTimes(1)
    pushSpy.mockRestore()
  })

  it('should invoke goBack', () => {
    const goBackSpy = jest.spyOn(history, 'back')
    testStub.dispatcher.goHome()
    testStub.dispatcher.goBack()
    expect(goBackSpy).toHaveBeenCalledTimes(1)
    goBackSpy.mockRestore()
  })

  it('should invoke replace', () => {
    const replaceSpy = jest.spyOn(history, 'replace')
    testStub.dispatcher.goHome()
    testStub.dispatcher.replace('app')
    expect(replaceSpy).toHaveBeenCalledTimes(1)
    replaceSpy.mockRestore()
  })

  it('should invoke go', () => {
    const goSpy = jest.spyOn(history, 'go')
    testStub.dispatcher.goHome()
    testStub.dispatcher.go(1)
    expect(goSpy).toHaveBeenCalledTimes(1)
    goSpy.mockRestore()
  })

  it('should invoke goForward', () => {
    const goForwardSpy = jest.spyOn(history, 'forward')
    testStub.dispatcher.goHome()
    testStub.dispatcher.goForward()
    expect(goForwardSpy).toHaveBeenCalledTimes(1)
    goForwardSpy.mockRestore()
  })

  it('should listen router changed', () => {
    testStub.dispatcher.listen()
    testStub.dispatcher.goHome()
    expect(testStub.getState().event?.action).toBe('PUSH')
  })

  it('stop one router$ should not effect others', () => {
    testStub.dispatcher.listenWithStopSignal()
    testStub.dispatcher.listen()
    testStub.dispatcher.goHome()
    testStub.dispatcher.stopListen$()
    testStub.dispatcher.replace('app')
    expect(testStub.getState().event?.action).toBe('REPLACE')
  })
})

describe('SigiRouterProvider', () => {
  const history: History = createMemoryHistory()
  let routerModule: RouterModule
  let renderer: RenderResult

  function Component() {
    routerModule = useInstance(RouterModule)
    return <div />
  }

  beforeEach(() => {
    renderer = render(
      <SigiRouterProvider history={history}>
        <Component />
      </SigiRouterProvider>,
    )
  })

  it('should be able to work with Provider', () => {
    expect(routerModule.router$).toBeInstanceOf(Subject)
    expect(routerModule['history']).toBe(history)
  })

  it('router$ should be replaced after history changed', () => {
    const { router$ } = routerModule
    const newHistory = createMemoryHistory()
    act(() => {
      renderer.rerender(
        <SigiRouterProvider history={newHistory}>
          <Component />
        </SigiRouterProvider>,
      )
    })
    expect(router$).not.toBe(routerModule.router$)
  })
})
