import 'reflect-metadata'

import { Store, InstanceActionOfEffectModule } from '@sigi/core'
import { Test } from '@sigi/testing'
import { Subject } from 'rxjs'
import * as Sinon from 'sinon'

import { HttpClient } from '../http.service'
import { AppModule, AppState } from '../app.module'

describe('app module test', () => {
  let getStub: Sinon.SinonStub
  let appStore: Store<AppState>
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
    appStore = appModule.createStore()
    actionsCreator = appModule.getActions()
    dataStream$ = new Subject()
    getStub.returns(dataStream$)
  })

  afterEach(() => {
    getStub.reset()
  })

  it('should handle loading/success state', () => {
    appStore.dispatch(actionsCreator.fetchList())
    expect(getStub.callCount).toBe(1)
    expect(appStore.getState().list).toBe(null)
    dataStream$.next([])
    expect(appStore.getState().list).toEqual([])
  })

  it('should handle loading/error state', () => {
    appStore.dispatch(actionsCreator.fetchList())
    expect(getStub.callCount).toBe(1)
    expect(appStore.getState().list).toBe(null)
    const errMsg = 'whatever'
    dataStream$.error(new TypeError(errMsg))
    expect(appStore.getState().list).toEqual(new TypeError(errMsg))
  })

  it('should handle cancel', () => {
    const defaultState = appStore.getState()
    appStore.dispatch(actionsCreator.fetchList())
    expect(getStub.callCount).toBe(1)
    expect(appStore.getState().list).toBe(null)
    appStore.dispatch(actionsCreator.cancel())
    dataStream$.next([1, 2, 3])
    expect(appStore.getState()).toEqual(defaultState)
  })
})
