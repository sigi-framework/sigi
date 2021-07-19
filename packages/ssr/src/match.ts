import { match as matchPath } from 'path-to-regexp'

import { SKIP_SYMBOL } from './run'

export function match<Ctx>(routers: string[], pathFactory: (ctx: Ctx) => string) {
  return <T>(payloadGetter: (ctx: Ctx, skip: symbol) => T | Promise<T>) => {
    return function payloadGetterWithMatch(ctx: Ctx, skip: symbol) {
      const requestPath = pathFactory(ctx)
      if (requestPath && routers.some((router) => matchPath(router)(requestPath))) {
        return payloadGetter(ctx, skip)
      }
      return SKIP_SYMBOL
    }
  }
}
