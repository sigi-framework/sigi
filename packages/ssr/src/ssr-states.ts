import { ConstructorOf, State } from '@sigi/types'
import { Ayanami } from '@sigi/core'

export class SSRStateCache {
  private SSRStates = new Map<ConstructorOf<Ayanami<any>>, Map<any, State<any>>>()

  private size = 1000

  setPoolSize(size: number) {
    if (this.SSRStates.size >= size) {
      this.SSRStates.clear()
    }
    this.size = size
  }

  has(ctx: any, constructor: ConstructorOf<Ayanami<any>>) {
    return this.SSRStates.has(ctx) && this.SSRStates.get(ctx)!.has(constructor)
  }

  get(ctx: any, constructor: ConstructorOf<Ayanami<any>>) {
    return this.SSRStates.get(ctx)?.get(constructor)
  }

  set(ctx: any, constructor: ConstructorOf<Ayanami<any>>, state: State<any>) {
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
