import { StoreInterface } from '@sigi/core'
import { Type } from '@sigi/di'

export class SSROneShotCache {
  private readonly cache = new Map<any, Map<Type<any>, any>>()

  private readonly activedCtx = new Set<any>()

  store(ctx: any, ctor: any, instance: any) {
    if (this.cache.has(ctx)) {
      this.cache.get(ctx)!.set(ctor, instance)
    } else {
      const cache = new Map()
      cache.set(ctor, instance)
      this.cache.set(ctx, cache)
    }
  }

  consume(ctx: any, ctor: any): any {
    const instance = this.cache.get(ctx)?.get(ctor)
    if (!this.activedCtx.has(ctx) && instance) {
      this.activedCtx.add(ctx)
      process.nextTick(() => {
        this.destroy(ctx)
      })
    }
    return instance
  }

  private destroy<T = any>(ctx: T) {
    if (this.activedCtx.has(ctx)) {
      this.activedCtx.delete(ctx)
      if (this.cache.has(ctx)) {
        for (const instance of this.cache.get(ctx)!.values()) {
          if (instance?.[StoreInterface]) {
            instance[StoreInterface].unsubscribe()
          }
        }
        this.cache.delete(ctx)
      }
    }
  }
}

export const oneShotCache = new SSROneShotCache()
