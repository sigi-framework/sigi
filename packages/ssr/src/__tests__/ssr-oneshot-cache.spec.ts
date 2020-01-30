import { spy } from 'sinon'
import { StateInterface } from '@sigi/core'

import { SSROneShotCache } from '../ssr-oneshot-cache'

const unsubscribeSpy = spy()

class Normal {}

class MockAyanami {
  state = {
    [StateInterface]: {
      unsubscribe: unsubscribeSpy,
    },
  }
}

class MockAyanamiLevel2 {
  state = {
    [StateInterface]: {
      unsubscribe: unsubscribeSpy,
    },
  }
}

describe('SSROneShotCache specs', () => {
  let cache: SSROneShotCache
  const ctx = Symbol()

  beforeEach(() => {
    cache = new SSROneShotCache()
  })

  afterEach(() => {
    unsubscribeSpy.resetHistory()
  })

  it('should work with ayanami#1', async () => {
    const instance = new MockAyanami()
    cache.store(ctx, MockAyanami, instance.state)
    expect(cache.consume(ctx, MockAyanami)).toBe(instance.state)
    await Promise.resolve()
    expect(cache.consume(ctx, MockAyanami)).toBe(undefined)
    expect(unsubscribeSpy.callCount).toBe(1)
  })

  it('should work with ayanami#2', async () => {
    const instance = new MockAyanami()
    const instanceLevel2 = new MockAyanamiLevel2()
    const normalInstance = new Normal()
    cache.store(ctx, MockAyanami, instance.state)
    cache.store(ctx, MockAyanamiLevel2, instanceLevel2.state)
    cache.store(ctx, Normal, normalInstance)
    expect(cache.consume(ctx, MockAyanami)).toBe(instance.state)
    expect(cache.consume(ctx, MockAyanamiLevel2)).toBe(instanceLevel2.state)
    expect(cache.consume(ctx, Normal)).toBe(normalInstance)
    await Promise.resolve()
    expect(cache.consume(ctx, MockAyanami)).toBe(undefined)
    expect(cache.consume(ctx, MockAyanamiLevel2)).toBe(undefined)
    expect(cache.consume(ctx, Normal)).toBe(undefined)
    expect(unsubscribeSpy.callCount).toBe(2)
  })

  it('should work with non-ayanami instance', async () => {
    const instance = new Normal()
    cache.store(ctx, Normal, instance)
    expect(cache.consume(ctx, Normal)).toBe(instance)
    await Promise.resolve()
    expect(cache.consume(ctx, Normal)).toBe(undefined)
    expect(unsubscribeSpy.callCount).toBe(0)
  })
})
