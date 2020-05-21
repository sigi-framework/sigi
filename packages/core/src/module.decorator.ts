import { Injectable } from '@sigi/di'

import { hmrEnabled, hmrInstanceCache } from './hmr'
import { EffectModule } from './module'

const configSets = new Set<string>()

export const Module = (name: string) => {
  if (typeof name !== 'string') {
    throw new TypeError('Module name should be string')
  }
  if (configSets.has(name)) {
    if (hmrEnabled) {
      console.warn(`Duplicated Module name found: \`${name}\`. this warning may caused by two reasons:
    1. You defined two modules with the same name passed. If so, you should check your definitions and avoid it.
    2. We detected your code is running with HMR environment. If so, you can safely ignore this warning.`)
    } else {
      throw new Error(`Duplicated Module name: ${name}`)
    }
  } else {
    configSets.add(name)
  }

  return (target: any) => {
    target.prototype.moduleName = name
    return Injectable()(target)
  }
}

if (hmrEnabled) {
  Module.removeModule = (name: string, instance: EffectModule<unknown>) => {
    configSets.delete(name)
    hmrInstanceCache.set(name, instance)
  }
}
