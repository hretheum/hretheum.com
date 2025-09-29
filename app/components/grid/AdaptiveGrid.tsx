'use client'

import React, { useEffect, useRef } from 'react'
import { useGridState } from './GridStateProvider'

interface AdaptiveGridProps {
  children: React.ReactNode
  className?: string
}

export function AdaptiveGrid({ children, className = '' }: AdaptiveGridProps) {
  const { currentState, isSupported } = useGridState()
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gridRef.current || !isSupported) return

    const grid = gridRef.current

    // Apply grid state classes
    grid.classList.remove('grid-compact', 'grid-expanded', 'grid-focused', 'grid-minimal')

    switch (currentState.state) {
      case 'compact':
        grid.classList.add('grid-compact')
        break
      case 'expanded':
        grid.classList.add('grid-expanded')
        break
      case 'focused':
        grid.classList.add('grid-focused')
        break
      case 'minimal':
        grid.classList.add('grid-minimal')
        break
    }

    // Add smooth transition
    grid.style.transition = 'all 0.3s ease-in-out'

  }, [currentState.state, isSupported])

  if (!isSupported) {
    return (
      <div ref={gridRef} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {children}
      </div>
    )
  }

  return (
    <div
      ref={gridRef}
      className={`adaptive-grid ${className}`}
      data-grid-state={currentState.state}
      data-confidence={currentState.confidence}
    >
      {children}
    </div>
  )
}