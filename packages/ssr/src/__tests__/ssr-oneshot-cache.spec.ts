import { spy } from 'sinon'
import { StateInterface } from '@sigi/core'

import { SSROneShotCache } from '../ssr-oneshot-cache'

const unsubscribeSpy = spy()

class Normal {}

class MockEffectModule {
  state = {
    [StateInterface]: {
      unsubscribe: unsubscribeSpy,
    },
  }
}

class MockEffectModuleLevel2 {
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

  it('should work with EffectModule#1', async () => {
    const instance = new MockEffectModule()
    cache.store(ctx, MockEffectModule, instance.state)
    expect(cache.consume(ctx, MockEffectModule)).toBe(instance.state)
    await Promise.resolve()
    expect(cache.consume(ctx, MockEffectModule)).toBe(undefined)
    expect(unsubscribeSpy.callCount).toBe(1)
  })

  it('should work with EffectModule#2', async () => {
    const instance = new MockEffectModule()
    const instanceLevel2 = new MockEffectModuleLevel2()
    const normalInstance = new Normal()
    cache.store(ctx, MockEffectModule, instance.state)
    cache.store(ctx, MockEffectModuleLevel2, instanceLevel2.state)
    cache.store(ctx, Normal, normalInstance)
    expect(cache.consume(ctx, MockEffectModule)).toBe(instance.state)
    expect(cache.consume(ctx, MockEffectModuleLevel2)).toBe(instanceLevel2.state)
    expect(cache.consume(ctx, Normal)).toBe(normalInstance)
    await Promise.resolve()
    expect(cache.consume(ctx, MockEffectModule)).toBe(undefined)
    expect(cache.consume(ctx, MockEffectModuleLevel2)).toBe(undefined)
    expect(cache.consume(ctx, Normal)).toBe(undefined)
    expect(unsubscribeSpy.callCount).toBe(2)
  })

  it('should work with non EffectModule instance', async () => {
    const instance = new Normal()
    cache.store(ctx, Normal, instance)
    expect(cache.consume(ctx, Normal)).toBe(instance)
    await Promise.resolve()
    expect(cache.consume(ctx, Normal)).toBe(undefined)
    expect(unsubscribeSpy.callCount).toBe(0)
  })
})
