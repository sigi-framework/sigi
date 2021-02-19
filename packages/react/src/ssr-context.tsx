import { createContext } from 'react'

import { _InjectableContext } from './injectable-context'

export const SSRSharedContext = createContext<string | null>(null)

export const SSRContext = _InjectableContext.Provider
