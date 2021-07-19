import { match } from '../match'
import { SKIP_SYMBOL } from '../run'

const CONTEXT = {
  request: {
    path: '/users/1111',
  },
}

describe('Match function test', () => {
  it('should return skip symbol if not matched', () => {
    const payloadGetter = match(
      ['/user/me'],
      (ctx: typeof CONTEXT) => ctx.request.path,
    )(() => {
      return 1
    })
    // @ts-expect-error
    expect(payloadGetter(CONTEXT)).toBe(SKIP_SYMBOL)
  })

  it('should return skip symbol if request factory return falsy value', () => {
    const payloadGetter = match(
      ['/user/me'],
      (_ctx: typeof CONTEXT) => '',
    )(() => {
      return 1
    })
    // @ts-expect-error
    expect(payloadGetter(CONTEXT)).toBe(SKIP_SYMBOL)
  })

  it('should into matched router', () => {
    const payloadGetter = match(
      ['/users/:id'],
      (ctx: typeof CONTEXT) => ctx.request.path,
    )(() => {
      return 1
    })
    expect(payloadGetter(CONTEXT, SKIP_SYMBOL)).toBe(1)
  })
})
