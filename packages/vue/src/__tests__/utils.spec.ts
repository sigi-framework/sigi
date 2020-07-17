import { CloneTrait, cloneDeepPoj } from '../utils'

describe('cloneDeepPoj specs', () => {
  function clone(obj: any) {
    return JSON.parse(JSON.stringify(obj))
  }

  it('should clone simple poj', () => {
    const fixture = {
      a: 1,
      b: '2',
      c: {
        d: [1, '2', { e: 3 }],
      },
    }

    expect(cloneDeepPoj(fixture)).toEqual(clone(fixture))
  })

  it('should be able to clone object which implement CloneTrait', () => {
    class Clone {
      constructor(public foo: string, public bar: number, public arr: string[]) {}

      [CloneTrait]() {
        return new Clone(this.foo, this.bar, [...this.arr])
      }
    }

    const fixture = new Clone('foo', 2, ['one', 'two'])

    expect(cloneDeepPoj(fixture)).toEqual(new Clone('foo', 2, ['one', 'two']))
  })

  it('should throw if object contains something could not clone', () => {
    expect(() => cloneDeepPoj({ foo: new Date() })).toThrow()
    expect(() => cloneDeepPoj({ bar: Symbol() })).toThrow()
  })

  it('should throw if MAX_OBJECT_DEPTH reached', () => {
    const a = { foo: {} }
    const b = { c: a }
    a.foo['whatever'] = b

    expect(() => cloneDeepPoj(a)).toThrow()
  })
})
