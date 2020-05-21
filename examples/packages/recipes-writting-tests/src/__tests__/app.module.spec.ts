import 'reflect-metadata'

import { Test, SigiTestModule, SigiTestStub } from '@sigi/testing'
import { Subject } from 'rxjs'
import * as Sinon from 'sinon'

import { AppModule, AppState } from '../app.module'
import { HttpClient } from '../http.service'

describe('app module test', () => {
  let getStub: Sinon.SinonStub
  let moduleStub: SigiTestStub<AppModule, AppState>
  let dataStream$: Subject<any>

  beforeEach(() => {
    getStub = Sinon.stub()
    const testbed = Test.createTestingModule({
      TestModule: SigiTestModule,
      providers: [AppModule, HttpClient],
    })
      .overrideProvider(HttpClient)
      .useValue({
        get: getStub,
      })
      .compile()
    moduleStub = testbed.getTestingStub(AppModule)
    dataStream$ = new Subject()
    getStub.returns(dataStream$)
  })

  afterEach(() => {
    getStub.reset()
  })

  it('should handle loading/success state', () => {
    moduleStub.dispatcher.fetchList()
    expect(getStub.callCount).toBe(1)
    expect(moduleStub.getState().list).toBe(null)
    dataStream$.next([])
    expect(moduleStub.getState().list).toEqual([])
  })

  it('should handle loading/error state', () => {
    moduleStub.dispatcher.fetchList()
    expect(getStub.callCount).toBe(1)
    expect(moduleStub.getState().list).toBe(null)
    const errMsg = 'whatever'
    dataStream$.error(new TypeError(errMsg))
    expect(moduleStub.getState().list).toEqual(new TypeError(errMsg))
  })

  it('should handle cancel', () => {
    const defaultState = moduleStub.getState()
    moduleStub.dispatcher.fetchList()
    expect(getStub.callCount).toBe(1)
    expect(moduleStub.getState().list).toBe(null)
    moduleStub.dispatcher.cancel()
    dataStream$.next([1, 2, 3])
    expect(moduleStub.getState()).toEqual(defaultState)
  })
})
