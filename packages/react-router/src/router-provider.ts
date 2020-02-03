import { createContext } from 'react'
import { History } from 'history'

export const SigiRouterContext = createContext<History | null>(null)

export const SigiRouterProvider = SigiRouterContext.Provider
