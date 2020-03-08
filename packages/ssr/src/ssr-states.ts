import { ConstructorOf, Store } from '@sigi/types'
import { EffectModule } from '@sigi/core'

export class SSRStateCache {
  private SSRStates = new Map<ConstructorOf<EffectModule<any>>, Map<any, Store<any>>>()

  private size = 1000

  setPoolSize(size: number) {
    if (this.SSRStates.size >= size) {
      this.SSRStates.clear()
    }
    this.size = size
  }

  has(ctx: any, constructor: ConstructorOf<EffectModule<any>>) {
    return this.SSRStates.has(ctx) && this.SSRStates.get(ctx)!.has(constructor)
  }

  get(ctx: any, constructor: ConstructorOf<EffectModule<any>>) {
    return this.SSRStates.get(ctx)?.get(constructor)
  }

  set(ctx: any, constructor: ConstructorOf<EffectModule<any>>, state: Store<any>) {
    if (this.SSRStates.size >= this.size) {
      this.SSRStates.clear()
    }
    if (this.SSRStates.has(ctx)) {
      this.SSRStates.get(ctx)!.set(constructor, state)
    } else {
      const caches = new Map()
      caches.set(constructor, state)
      this.SSRStates.set(ctx, caches)
    }
  }

  cleanupStateByContext = (ctx: any) => {
    const states = this.SSRStates.get(ctx)
    if (states) {
      for (const [, state] of states) {
        state.unsubscribe()
      }
    }
    this.SSRStates.delete(ctx)
  }
}

export const SSRStateCacheInstance = new SSRStateCache()
