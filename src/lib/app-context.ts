import { createContext, useContext } from 'react'
import type { useProgress } from './storage'

export type AppState = ReturnType<typeof useProgress>

export const AppContext = createContext<AppState>(null as unknown as AppState)
export const useApp = () => useContext(AppContext)
