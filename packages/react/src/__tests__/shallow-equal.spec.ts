import { shallowEqual } from '../shallow-equal'

describe('shallow equal', () => {
  it('should successfully compare literal primitive values', () => {
    expect(shallowEqual(1, 1)).toBeTruthy()
    expect(shallowEqual('1', '1')).toBeTruthy()
    expect(shallowEqual(true, true)).toBeTruthy()
    expect(shallowEqual(undefined, undefined)).toBeTruthy()
    const fn = () => 0
    expect(shallowEqual(fn, fn)).toBeTruthy()

    expect(shallowEqual(1, 2)).toBeFalsy()
    expect(shallowEqual('1', '2')).toBeFalsy()
    expect(shallowEqual(true, false)).toBeFalsy()
    expect(shallowEqual(undefined, null)).toBeFalsy()
    expect(
      shallowEqual(
        () => 0,
        () => 0,
      ),
    ).toBeFalsy()
  })

  it('should successfully compare Array', () => {
    expect(shallowEqual([], [])).toBeTruthy()
    expect(shallowEqual([1], [1])).toBeTruthy()
    expect(shallowEqual(['1'], ['1'])).toBeTruthy()

    expect(shallowEqual([{}], [{}])).toBeFalsy()
    expect(shallowEqual([1], [2])).toBeFalsy()
    expect(shallowEqual(['1'], ['2'])).toBeFalsy()
    expect(shallowEqual(1, [])).toBeFalsy()
    expect(shallowEqual([], [1])).toBeFalsy()
  })

  it('should successfully compare object', () => {
    expect(shallowEqual({}, {})).toBeTruthy()
    expect(shallowEqual({ a: 1 }, { a: 1 })).toBeTruthy()

    const obj = { a: { b: 1 } }
    expect(shallowEqual(obj, obj)).toBeTruthy()

    expect(shallowEqual({ a: 1 }, { a: 1, b: 1 })).toBeFalsy()
  })
})
