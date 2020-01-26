import { Injectable } from '@sigi/di'

const configSets = new Set<string>()

export const Module = (name: string) => {
  if (typeof name !== 'string') {
    throw new TypeError('Module name should be string')
  }
  if (configSets.has(name)) {
    throw new Error(`Duplicated Module name: ${name}`)
  }
  configSets.add(name)

  return (target: any) => {
    target.prototype.moduleName = name
    return Injectable()(target)
  }
}
