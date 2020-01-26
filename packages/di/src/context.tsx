import React, { createContext, useContext, useMemo, memo } from 'react'

import { rootInjector } from './root-injector'
import { Provider } from './type'
import { Injector } from './injector'

const _InjectableContext = createContext<Injector>(rootInjector)

export function InjectableContext({ children }: { children: React.ReactNode }) {
  return <_InjectableContext.Provider value={rootInjector}>{children}</_InjectableContext.Provider>
}

const ProvidersContext = createContext<Provider[]>([])

export const InjectionProvidersContext = memo<{ providers?: Provider[]; children: React.ReactNode }>(
  ({ providers = [], children }) => {
    const parentInjector = useContext(_InjectableContext)
    const childInjectableFactory = useMemo(() => parentInjector.createChild(providers), [providers])
    return (
      <_InjectableContext.Provider value={childInjectableFactory}>
        <ProvidersContext.Provider value={providers}>{children}</ProvidersContext.Provider>
      </_InjectableContext.Provider>
    )
  },
)

export function useInstance<T>(provider: Provider<T>): T {
  const childInjector = useContext(_InjectableContext)

  return childInjector.getInstance(provider)
}
