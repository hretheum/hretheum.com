// Behavior Analysis Engine for Grid State Detection
// Analyzes user behavior patterns in real-time for adaptive UI

export interface BehaviorMetrics {
  scrollVelocity: number
  mouseMovement: number
  clickFrequency: number
  dwellTime: number
  focusAreas: string[]
}

export interface GridState {
  state: 'compact' | 'expanded' | 'focused' | 'minimal'
  confidence: number
  timestamp: number
}

export type GridStateTransition = {
  from: GridState['state']
  to: GridState['state']
  reason: string
  timestamp: number
}

// Real-time behavior tracking
class BehaviorTracker {
  private metrics: BehaviorMetrics = {
    scrollVelocity: 0,
    mouseMovement: 0,
    clickFrequency: 0,
    dwellTime: 0,
    focusAreas: []
  }

  private scrollHistory: number[] = []
  private mouseHistory: { x: number; y: number; timestamp: number }[] = []
  private clickHistory: number[] = []
  private focusHistory: string[] = []

  private readonly MAX_HISTORY = 100
  private readonly ANALYSIS_WINDOW = 5000 // 5 seconds

  constructor() {
    this.initializeTracking()
  }

  private initializeTracking() {
    // Scroll velocity tracking
    let lastScrollTime = Date.now()
    let lastScrollTop = window.scrollY

    window.addEventListener('scroll', () => {
      const now = Date.now()
      const currentScrollTop = window.scrollY
      const timeDiff = now - lastScrollTime
      const scrollDiff = Math.abs(currentScrollTop - lastScrollTop)

      if (timeDiff > 0) {
        const velocity = scrollDiff / timeDiff
        this.scrollHistory.push(velocity)

        // Keep only recent history
        if (this.scrollHistory.length > this.MAX_HISTORY) {
          this.scrollHistory = this.scrollHistory.slice(-this.MAX_HISTORY)
        }
      }

      lastScrollTime = now
      lastScrollTop = currentScrollTop
    })

    // Mouse movement tracking
    let lastMouseTime = Date.now()
    let lastMouseX = 0
    let lastMouseY = 0

    window.addEventListener('mousemove', (e) => {
      const now = Date.now()
      const timeDiff = now - lastMouseTime
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastMouseX, 2) + Math.pow(e.clientY - lastMouseY, 2)
      )

      if (timeDiff > 0) {
        const speed = distance / timeDiff
        this.mouseHistory.push({ x: e.clientX, y: e.clientY, timestamp: now })

        if (this.mouseHistory.length > this.MAX_HISTORY) {
          this.mouseHistory = this.mouseHistory.slice(-this.MAX_HISTORY)
        }
      }

      lastMouseTime = now
      lastMouseX = e.clientX
      lastMouseY = e.clientY
    })

    // Click tracking
    window.addEventListener('click', (e) => {
      const now = Date.now()
      this.clickHistory.push(now)

      // Keep only recent clicks (last 30 seconds)
      this.clickHistory = this.clickHistory.filter(
        timestamp => now - timestamp < 30000
      )

      // Track focus areas based on clicked elements
      const target = e.target as HTMLElement
      const focusArea = this.getFocusArea(target)
      if (focusArea) {
        this.focusHistory.push(focusArea)
        if (this.focusHistory.length > 50) {
          this.focusHistory = this.focusHistory.slice(-50)
        }
      }
    })

    // Dwell time tracking with Intersection Observer
    this.initializeDwellTracking()
  }

  private initializeDwellTracking() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element entered viewport
            this.metrics.dwellTime += 100 // Simple increment
          }
        })
      },
      { threshold: 0.5 }
    )

    // Observe major content sections
    document.querySelectorAll('section, .content-block, .grid-item').forEach(el => {
      observer.observe(el)
    })
  }

  private getFocusArea(element: HTMLElement): string | null {
    // Determine focus area based on element characteristics
    if (element.closest('.hero, .header, .cta')) return 'hero'
    if (element.closest('.content, .article, .case-study')) return 'content'
    if (element.closest('.sidebar, .navigation, .menu')) return 'navigation'
    if (element.closest('.footer, .contact')) return 'footer'
    return null
  }

  // Get current behavior metrics
  getCurrentMetrics(): BehaviorMetrics {
    const now = Date.now()

    // Calculate scroll velocity (average over last 5 seconds)
    const recentScrolls = this.scrollHistory.filter(
      timestamp => now - timestamp < this.ANALYSIS_WINDOW
    )
    const avgScrollVelocity = recentScrolls.length > 0
      ? recentScrolls.reduce((sum, v) => sum + v, 0) / recentScrolls.length
      : 0

    // Calculate mouse movement (average speed over last 5 seconds)
    const recentMouse = this.mouseHistory.filter(
      m => now - m.timestamp < this.ANALYSIS_WINDOW
    )
    const totalMouseDistance = recentMouse.length > 1
      ? recentMouse.slice(1).reduce((sum, m, i) => {
          const prev = recentMouse[i]
          return sum + Math.sqrt(Math.pow(m.x - prev.x, 2) + Math.pow(m.y - prev.y, 2))
        }, 0)
      : 0
    const avgMouseMovement = recentMouse.length > 0
      ? totalMouseDistance / (recentMouse.length * 100) // Normalize
      : 0

    // Calculate click frequency (clicks per minute over last 30 seconds)
    const recentClicks = this.clickHistory.filter(
      timestamp => now - timestamp < 30000
    )
    const clickFrequency = (recentClicks.length / 30) * 60 // clicks per minute

    // Get most common focus areas
    const focusCount = this.focusHistory.reduce((acc, area) => {
      acc[area] = (acc[area] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const focusAreas = Object.entries(focusCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([area]) => area)

    return {
      scrollVelocity: avgScrollVelocity,
      mouseMovement: avgMouseMovement,
      clickFrequency,
      dwellTime: this.metrics.dwellTime,
      focusAreas
    }
  }
}

// Grid State Machine
class GridStateMachine {
  private currentState: GridState['state'] = 'compact'
  private stateHistory: GridState[] = []
  private transitions: GridStateTransition[] = []

  constructor() {
    this.loadPersistedState()
  }

  // Analyze behavior and determine optimal grid state
  analyzeAndTransition(metrics: BehaviorMetrics): GridState {
    const now = Date.now()

    // State determination logic
    let newState: GridState['state'] = 'compact'
    let confidence = 0.5
    let reason = 'default'

    // High engagement = expanded state
    if (metrics.clickFrequency > 5 || metrics.mouseMovement > 0.1) {
      newState = 'expanded'
      confidence = 0.8
      reason = 'high_engagement'
    }
    // Low activity, long dwell = focused state
    else if (metrics.dwellTime > 1000 && metrics.scrollVelocity < 0.01) {
      newState = 'focused'
      confidence = 0.7
      reason = 'deep_reading'
    }
    // Very low activity = minimal state
    else if (metrics.scrollVelocity < 0.001 && metrics.mouseMovement < 0.01) {
      newState = 'minimal'
      confidence = 0.6
      reason = 'low_activity'
    }

    // Transition if state changed significantly
    if (newState !== this.currentState && confidence > 0.6) {
      const transition: GridStateTransition = {
        from: this.currentState,
        to: newState,
        reason,
        timestamp: now
      }

      this.transitions.push(transition)
      this.currentState = newState

      const gridState: GridState = {
        state: newState,
        confidence,
        timestamp: now
      }

      this.stateHistory.push(gridState)
      this.persistState(gridState)

      // Keep history manageable
      if (this.stateHistory.length > 50) {
        this.stateHistory = this.stateHistory.slice(-50)
      }
      if (this.transitions.length > 100) {
        this.transitions = this.transitions.slice(-100)
      }

      return gridState
    }

    return {
      state: this.currentState,
      confidence: 0.9, // High confidence for stable states
      timestamp: now
    }
  }

  private loadPersistedState() {
    try {
      const persisted = localStorage.getItem('grid-state')
      if (persisted) {
        const state = JSON.parse(persisted) as GridState
        // Only restore if recent (within 24 hours)
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          this.currentState = state.state
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted grid state:', error)
    }
  }

  private persistState(state: GridState) {
    try {
      localStorage.setItem('grid-state', JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to persist grid state:', error)
    }
  }

  getCurrentState(): GridState {
    return {
      state: this.currentState,
      confidence: 0.9,
      timestamp: Date.now()
    }
  }

  getStateHistory(): GridState[] {
    return [...this.stateHistory]
  }

  getTransitions(): GridStateTransition[] {
    return [...this.transitions]
  }
}

// Main Behavior Analysis Engine
export class BehaviorAnalysisEngine {
  private tracker: BehaviorTracker
  private stateMachine: GridStateMachine
  private analysisInterval: NodeJS.Timeout | null = null
  private listeners: ((state: GridState) => void)[] = []

  constructor() {
    this.tracker = new BehaviorTracker()
    this.stateMachine = new GridStateMachine()
    this.startAnalysis()
  }

  private startAnalysis() {
    // Analyze behavior every 2 seconds
    this.analysisInterval = setInterval(() => {
      const metrics = this.tracker.getCurrentMetrics()
      const newState = this.stateMachine.analyzeAndTransition(metrics)

      // Notify listeners of state changes
      if (newState.state !== this.stateMachine.getCurrentState().state) {
        this.listeners.forEach(listener => listener(newState))
      }
    }, 2000)
  }

  // Public API
  getCurrentState(): GridState {
    return this.stateMachine.getCurrentState()
  }

  getBehaviorMetrics(): BehaviorMetrics {
    return this.tracker.getCurrentMetrics()
  }

  onStateChange(listener: (state: GridState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  destroy() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }
  }
}

// Browser compatibility check
export function isBehaviorAnalysisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'IntersectionObserver' in window &&
    'localStorage' in window
  )
}

// Singleton instance for global use
let globalEngine: BehaviorAnalysisEngine | null = null

export function getBehaviorAnalysisEngine(): BehaviorAnalysisEngine {
  if (!globalEngine) {
    if (!isBehaviorAnalysisSupported()) {
      throw new Error('Behavior analysis not supported in this browser')
    }
    globalEngine = new BehaviorAnalysisEngine()
  }
  return globalEngine
}