export function shallowEqual(objA: any, objB: any) {
  if (objA === objB) {
    return true
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) {
    return false
  }

  const hasOwnProperty = Object.prototype.hasOwnProperty

  for (const key of keysA) {
    if (!hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
      return false
    }
  }

  return true
}
