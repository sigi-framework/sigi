import Sinon from 'sinon'
import { noop } from 'rxjs'
import { Ayanami } from '@sigi/core'

import { SSRStateCache } from '../ssr-states'

describe('SSRStateCacheInstance specs:', () => {
  let SSRStateCacheInstance: SSRStateCache
  class A extends Ayanami<{}> {
    defaultState = {}
  }
  const ctx = {}
  const state = Object.create({
    unsubscribe: noop,
  })
  beforeEach(() => {
    SSRStateCacheInstance = new SSRStateCache()
    SSRStateCacheInstance.set(ctx, A, state)
  })

  it('has should work', () => {
    expect(SSRStateCacheInstance.has(ctx, A)).toBe(true)
  })

  it('get existed should work', () => {
    expect(SSRStateCacheInstance.get(ctx, A)).toBe(state)
  })

  it('get not existed should return undefined', () => {
    expect(SSRStateCacheInstance.get({}, A)).toBe(undefined)
  })

  it('should clear all if pool size smaller than cache size', () => {
    SSRStateCacheInstance.setPoolSize(1)
    expect(SSRStateCacheInstance.get({}, A)).toBe(undefined)
    const newCtx = {}
    const newState = Object.create(null)
    SSRStateCacheInstance.set(newCtx, A, newState)
    expect(SSRStateCacheInstance.get(newCtx, A)).toBe(newState)
    SSRStateCacheInstance.set(ctx, A, state)
    expect(SSRStateCacheInstance.get(newCtx, A)).toBe(undefined)
  })

  it('should delete all states after cleanupStateByContext', () => {
    const spy = Sinon.spy()
    const newState = Object.create({
      unsubscribe: spy,
    })
    class B extends Ayanami<{}> {
      defaultState = {}
    }
    SSRStateCacheInstance.set(ctx, B, newState)
    expect(SSRStateCacheInstance.get(ctx, B)).toBe(newState)
    SSRStateCacheInstance.cleanupStateByContext(ctx)
    expect(SSRStateCacheInstance.get(ctx, A)).toBeUndefined()
    expect(SSRStateCacheInstance.get(ctx, B)).toBeUndefined()
    expect(spy.callCount).toBe(1)
  })

  it('should do nothing when cleanupStateByContext non-existed ctx', () => {
    SSRStateCacheInstance.cleanupStateByContext({})
    expect(SSRStateCacheInstance.get(ctx, A)).toBe(state)
  })
})
