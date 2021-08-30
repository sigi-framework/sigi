import { rootInjector, Provider, Injector } from '@sigi-stringke/di'
import React, { createContext, useContext, useMemo, memo } from 'react'

// @internal
export const _InjectableContext = createContext<Injector>(rootInjector)

export const InjectionProvidersContext = memo<{ providers?: Provider[]; children: React.ReactNode }>(
  ({ providers = [], children }) => {
    const parentInjector = useContext(_InjectableContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const childInjectableFactory = useMemo(() => parentInjector.createChild(providers), [parentInjector, ...providers])
    return <_InjectableContext.Provider value={childInjectableFactory}>{children}</_InjectableContext.Provider>
  },
)

export function useInstance<T>(provider: Provider<T>): T {
  const childInjector = useContext(_InjectableContext)

  return childInjector.getInstance(provider)
}

export function useServerInstance<T>(provider: Provider<T>): T {
  const childInjector = useContext(_InjectableContext)

  // @ts-expect-error
  return childInjector.serverCache?.get(provider) || childInjector.getInstance(provider)
}
