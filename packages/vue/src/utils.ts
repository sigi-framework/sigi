export const MAX_OBJECT_DEPTH = 100

export const CloneTrait = Symbol('clone-trait')

export function cloneDeepPoj<T = any>(target: T): T {
  let depth = 0
  function _clone(obj: any) {
    if (depth >= MAX_OBJECT_DEPTH) {
      throw new TypeError('Max clone depth reached')
    }

    depth++

    if (typeof obj === 'object') {
      if (obj[CloneTrait]) {
        return obj[CloneTrait]()
      }
      if (Array.isArray(obj)) {
        return obj.map((item) => cloneDeepPoj(item)) as unknown as T
      }

      if (!isPlainObject(obj)) {
        throw new TypeError('Only plain object supported to sync to Sigi')
      }

      const result = Object.create(null)
      for (const [key, value] of Object.entries(obj)) {
        result[key] = _clone(value)
      }
      return result
    }

    if (typeof obj === 'function' || typeof obj === 'symbol') {
      throw new TypeError(`${typeof obj} type could not be cloned`)
    }

    return obj
  }

  return _clone(target)
}

function isPlainObject(obj: unknown): boolean {
  return Object.prototype.toString.call(obj) === '[object Object]'
}
