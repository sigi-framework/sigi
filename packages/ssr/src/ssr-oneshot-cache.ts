import { StoreInterface } from '@sigi/core'
import { Type } from '@sigi/di'

export class SSROneShotCache {
  private readonly cache = new Map<any, Map<Type<any>, any>>()

  private readonly activatedCtx = new Set<any>()

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
    if (!this.activatedCtx.has(ctx) && instance) {
      this.activatedCtx.add(ctx)
      process.nextTick(() => {
        this.destroy(ctx)
      })
    }
    return instance
  }

  private destroy<T = any>(ctx: T) {
    if (this.activatedCtx.has(ctx)) {
      this.activatedCtx.delete(ctx)
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
