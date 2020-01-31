import 'reflect-metadata'

import { State, InstanceActionOfEffectModule } from '@sigi/core'
import { Test } from '@sigi/testing'
import { Subject } from 'rxjs'
import * as Sinon from 'sinon'

import { HttpClient } from '../http.service'
import { AppModule, AppState } from '../app.module'

describe('app module test', () => {
  let getStub: Sinon.SinonStub
  let appState: State<AppState>
  let actionsCreator: InstanceActionOfEffectModule<AppModule, AppState>
  let dataStream$: Subject<any>

  beforeEach(() => {
    getStub = Sinon.stub()
    const testbed = Test.createTestingModule({
      providers: [AppModule, HttpClient],
    })
      .overrideProvider(HttpClient)
      .useValue({
        get: getStub,
      })
      .compile()
    const appModule = testbed.getInstance(AppModule)
    appState = appModule.createState()
    actionsCreator = appModule.getActions()
    dataStream$ = new Subject()
    getStub.returns(dataStream$)
  })

  afterEach(() => {
    getStub.reset()
  })

  it('should handle loading/success state', () => {
    appState.dispatch(actionsCreator.fetchList())
    expect(getStub.callCount).toBe(1)
    expect(appState.getState().list).toBe(null)
    dataStream$.next([])
    expect(appState.getState().list).toEqual([])
  })

  it('should handle loading/error state', () => {
    appState.dispatch(actionsCreator.fetchList())
    expect(getStub.callCount).toBe(1)
    expect(appState.getState().list).toBe(null)
    const errMsg = 'whatever'
    dataStream$.error(new TypeError(errMsg))
    expect(appState.getState().list).toEqual(new TypeError(errMsg))
  })

  it('should handle cancel', () => {
    const defaultState = appState.getState()
    appState.dispatch(actionsCreator.fetchList())
    expect(getStub.callCount).toBe(1)
    expect(appState.getState().list).toBe(null)
    appState.dispatch(actionsCreator.cancel())
    dataStream$.next([1, 2, 3])
    expect(appState.getState()).toEqual(defaultState)
  })
})
