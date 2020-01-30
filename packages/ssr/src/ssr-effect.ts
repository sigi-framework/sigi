import { Effect, SSRSymbol, ACTION_TO_SKIP_KEY } from '@sigi/core'

export const SKIP_SYMBOL = Symbol('skip')

function addDecorator(target: any, method: any, middleware: any) {
  const existedMetas = Reflect.getMetadata(SSRSymbol, target)
  const meta = { action: method, middleware }
  if (existedMetas) {
    existedMetas.push(meta)
  } else {
    Reflect.defineMetadata(SSRSymbol, [meta], target)
  }
}

interface SSREffectOptions<Context, Payload> {
  /**
   * Function used to get effect payload.
   *
   * if SKIP_SYMBOL returned(`return skip()`), effect won't get dispatched when SSR
   *
   * @param req express request object
   * @param skip get a symbol used to let effect escape from ssr effects dispatching
   */
  payloadGetter?: (req: Context, skip: () => typeof SKIP_SYMBOL) => Payload | Promise<Payload> | typeof SKIP_SYMBOL

  /**
   * Whether skip first effect dispatching in client if effect ever got dispatched when SSR
   *
   * @default true
   */
  skipFirstClientDispatch?: boolean
}

export function SSREffect<T, Context, Payload>(options?: SSREffectOptions<Context, Payload>) {
  const { payloadGetter, skipFirstClientDispatch } = {
    payloadGetter: undefined,
    skipFirstClientDispatch: true,
    ...options,
  }

  return (target: T, method: string, descriptor: PropertyDescriptor) => {
    addDecorator(target, method, payloadGetter)
    if (skipFirstClientDispatch) {
      const actionsToSkip: Set<string> = Reflect.getMetadata(ACTION_TO_SKIP_KEY, target) || new Set()
      actionsToSkip.add(method)
      Reflect.defineMetadata(ACTION_TO_SKIP_KEY, actionsToSkip, target)
    }
    return Effect()(target, method, descriptor)
  }
}
