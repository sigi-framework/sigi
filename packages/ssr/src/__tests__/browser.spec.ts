import { vi } from 'vitest'
import { restoreState } from '../browser'

beforeEach(() => {
  // @ts-expect-error
  global.document = {}
  // @ts-expect-error
  global.window = {}
})

afterEach(() => {
  // @ts-expect-error
  delete global.document
  // @ts-expect-error
  delete global.window
})

describe('Browser function test', () => {
  it('should add data into window', () => {
    global.document.getElementById = vi.fn().mockReturnValue({ textContent: '{}' })
    restoreState()
    expect(global.window['SIGI_STATE']).toEqual({})
    expect(global.window['SIGI_RETRY']).toEqual({})
  })

  it('should not add data into window', () => {
    global.document.getElementById = vi.fn().mockReturnValue(null)
    restoreState()
    expect(global.window['SIGI_STATE']).toEqual(undefined)
    expect(global.window['SIGI_RETRY']).toEqual(undefined)
  })
})
