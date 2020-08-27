import 'reflect-metadata'
import { EffectModule, Effect, Module, Reducer, Action, DefineAction } from '@sigi/core'
import { Test, SigiTestModule, SigiTestStub } from '@sigi/testing'
import { History, createMemoryHistory } from 'history'
import React from 'react'
import { create, act, ReactTestRenderer } from 'react-test-renderer'
import { Observable, noop } from 'rxjs'
import { map, exhaustMap, takeUntil, switchMap } from 'rxjs/operators'
import * as Sinon from 'sinon'

import { SigiRouterProvider } from '../router-provider'
import { RouterModule, RouterChanged } from '../router.module'

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
        this.routerModule.createRouterObservable().pipe(
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
        this.routerModule.createRouterObservable().pipe(
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
  let renderer: ReactTestRenderer
  act(() => {
    renderer = create(<SigiRouterProvider history={history}>1</SigiRouterProvider>)
  })
  beforeEach(() => {
    const testingModule = Test.createTestingModule({
      TestModule: SigiTestModule,
    }).compile()

    testStub = testingModule.getTestingStub(TestModule)
  })

  it('should invoke push', () => {
    const pushSpy = Sinon.spy(history, 'push')
    testStub.dispatcher.goHome()
    expect(pushSpy.callCount).toBe(1)
    pushSpy.restore()
  })

  it('should invoke goBack', () => {
    const goBackSpy = Sinon.spy(history, 'goBack')
    testStub.dispatcher.goHome()
    testStub.dispatcher.goBack()
    expect(goBackSpy.callCount).toBe(1)
    goBackSpy.restore()
  })

  it('should invoke replace', () => {
    const replaceSpy = Sinon.spy(history, 'replace')
    testStub.dispatcher.goHome()
    testStub.dispatcher.replace('app')
    expect(replaceSpy.callCount).toBe(1)
    replaceSpy.restore()
  })

  it('should invoke go', () => {
    const goSpy = Sinon.spy(history, 'go')
    testStub.dispatcher.goHome()
    testStub.dispatcher.go(1)
    expect(goSpy.callCount).toBe(1)
    goSpy.restore()
  })

  it('should invoke goForward', () => {
    const goForwardSpy = Sinon.spy(history, 'goForward')
    testStub.dispatcher.goHome()
    testStub.dispatcher.goForward()
    expect(goForwardSpy.callCount).toBe(1)
    goForwardSpy.restore()
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

  it('should warning if in development mode replace the history object', () => {
    const newHistory = Object.create({
      listen: noop,
    })
    const warnStub = Sinon.stub(console, 'warn')
    const { NODE_ENV } = process.env
    process.env.NODE_ENV = 'development'
    act(() => {
      renderer.update(<SigiRouterProvider history={newHistory}>2</SigiRouterProvider>)
    })

    expect(warnStub.callCount).toBe(1)

    warnStub.restore()
    process.env.NODE_ENV = NODE_ENV
  })
})
