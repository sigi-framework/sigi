import { createContext } from 'react'

export const SSRSharedContext = createContext<string | null>(null)
export const SSRContext = createContext<any>(null)
