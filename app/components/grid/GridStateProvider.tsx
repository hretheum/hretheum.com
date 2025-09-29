'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { BehaviorAnalysisEngine, GridState, isBehaviorAnalysisSupported } from '@/lib/behavior'

interface GridStateContextType {
  currentState: GridState
  behaviorMetrics: any
  isSupported: boolean
}

const GridStateContext = createContext<GridStateContextType | null>(null)

export function GridStateProvider({ children }: { children: React.ReactNode }) {
  const [currentState, setCurrentState] = useState<GridState>({
    state: 'compact',
    confidence: 0.9,
    timestamp: Date.now()
  })

  const [behaviorMetrics, setBehaviorMetrics] = useState(null)
  const [isSupported, setIsSupported] = useState(false)
  const [engine, setEngine] = useState<BehaviorAnalysisEngine | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const supported = isBehaviorAnalysisSupported()
    setIsSupported(supported)

    if (supported) {
      try {
        const behaviorEngine = new BehaviorAnalysisEngine()
        setEngine(behaviorEngine)

        // Subscribe to state changes
        const unsubscribe = behaviorEngine.onStateChange((newState) => {
          setCurrentState(newState)
        })

        // Update behavior metrics periodically
        const metricsInterval = setInterval(() => {
          setBehaviorMetrics(behaviorEngine.getBehaviorMetrics())
        }, 2000)

        return () => {
          unsubscribe()
          clearInterval(metricsInterval)
          behaviorEngine.destroy()
        }
      } catch (error) {
        console.warn('Failed to initialize behavior analysis:', error)
      }
    }
  }, [])

  return (
    <GridStateContext.Provider value={{
      currentState,
      behaviorMetrics,
      isSupported
    }}>
      {children}
    </GridStateContext.Provider>
  )
}

export function useGridState() {
  const context = useContext(GridStateContext)
  if (!context) {
    throw new Error('useGridState must be used within a GridStateProvider')
  }
  return context
}