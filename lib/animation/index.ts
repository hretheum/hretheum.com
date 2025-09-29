// Smooth Animation Framework for Grid State Transitions
// GPU-accelerated CSS Grid animations with performance optimization

export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
  fill?: 'forwards' | 'backwards' | 'both' | 'none'
}

export interface GridAnimationState {
  from: string
  to: string
  config: AnimationConfig
  element: HTMLElement
}

export type AnimationQueue = GridAnimationState[]

export class SmoothAnimationFramework {
  private animationQueue: AnimationQueue = []
  private activeAnimations = new Set<HTMLElement>()
  private observer: IntersectionObserver | null = null
  private performanceObserver: PerformanceObserver | null = null

  constructor() {
    this.initializeIntersectionObserver()
    this.initializePerformanceObserver()
  }

  private initializeIntersectionObserver() {
    // Intersection Observer for scroll-triggered animations
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.triggerScrollAnimations(entry.target as HTMLElement)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    // Observe grid containers and animated elements
    this.observeAnimatedElements()
  }

  private observeAnimatedElements() {
    const elements = document.querySelectorAll('.adaptive-grid, .grid-item, [data-animate]')
    elements.forEach(el => this.observer?.observe(el))
  }

  private initializePerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') return

    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.includes('animation')) {
          this.logPerformanceMetric(entry.name, entry.duration)
        }
      })
    })

    try {
      this.performanceObserver.observe({ entryTypes: ['measure'] })
    } catch (e) {
      console.warn('Performance Observer not supported:', e)
    }
  }

  private logPerformanceMetric(name: string, duration: number) {
    // Log to console for debugging
    console.log(`[Animation] ${name}: ${duration.toFixed(2)}ms`)

    // Could send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
        event_category: 'animation'
      })
    }
  }

  // GPU-accelerated grid animations
  animateGridTransition(
    element: HTMLElement,
    fromState: string,
    toState: string,
    config: Partial<AnimationConfig> = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      // Prevent multiple animations on same element
      if (this.activeAnimations.has(element)) {
        resolve()
        return
      }

      this.activeAnimations.add(element)

      const animationConfig: AnimationConfig = {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        delay: 0,
        fill: 'forwards',
        ...config
      }

      // Start performance measurement
      const animationName = `grid-${fromState}-to-${toState}`
      performance.mark(`${animationName}-start`)

      // Apply animation classes for CSS-based animations
      element.classList.remove(`grid-${fromState}`, `grid-${toState}`)
      element.classList.add(`grid-${toState}`)

      // Use Web Animations API for precise control
      const animation = element.animate(
        this.getGridKeyframes(fromState, toState),
        {
          duration: animationConfig.duration,
          easing: animationConfig.easing,
          delay: animationConfig.delay,
          fill: animationConfig.fill
        }
      )

      // Handle animation completion
      animation.onfinish = () => {
        performance.mark(`${animationName}-end`)
        performance.measure(animationName, `${animationName}-start`, `${animationName}-end`)

        this.activeAnimations.delete(element)
        element.classList.remove(`grid-${fromState}`)
        resolve()
      }

      // Handle animation cancellation
      animation.oncancel = () => {
        this.activeAnimations.delete(element)
        resolve()
      }
    })
  }

  private getGridKeyframes(fromState: string, toState: string): Keyframe[] {
    // Define keyframes based on grid state transition
    const keyframes: Keyframe[] = []

    switch (`${fromState}-${toState}`) {
      case 'compact-expanded':
        keyframes.push(
          { transform: 'scale(0.95)', opacity: 0.8 },
          { transform: 'scale(1)', opacity: 1 }
        )
        break

      case 'expanded-compact':
        keyframes.push(
          { transform: 'scale(1.05)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1 }
        )
        break

      case 'focused-minimal':
        keyframes.push(
          { transform: 'translateY(10px)', opacity: 0.9 },
          { transform: 'translateY(0)', opacity: 1 }
        )
        break

      default:
        keyframes.push(
          { opacity: 0.9 },
          { opacity: 1 }
        )
    }

    return keyframes
  }

  // Scroll-triggered animations
  private triggerScrollAnimations(element: HTMLElement) {
    const animations = element.querySelectorAll('[data-animate-on-scroll]')
    animations.forEach((el) => {
      const target = el as HTMLElement
      const animationType = target.dataset.animateOnScroll || 'fade-up'

      this.animateOnScroll(target, animationType)
    })
  }

  private animateOnScroll(element: HTMLElement, animationType: string): Promise<void> {
    return new Promise((resolve) => {
      if (element.dataset.animated) {
        resolve()
        return
      }

      element.dataset.animated = 'true'

      const keyframes: Keyframe[] = []

      switch (animationType) {
        case 'fade-up':
          keyframes.push(
            { transform: 'translateY(30px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
          )
          break

        case 'fade-in':
          keyframes.push(
            { opacity: 0 },
            { opacity: 1 }
          )
          break

        case 'slide-left':
          keyframes.push(
            { transform: 'translateX(-30px)', opacity: 0 },
            { transform: 'translateX(0)', opacity: 1 }
          )
          break

        case 'slide-right':
          keyframes.push(
            { transform: 'translateX(30px)', opacity: 0 },
            { transform: 'translateX(0)', opacity: 1 }
          )
          break

        default:
          keyframes.push(
            { opacity: 0 },
            { opacity: 1 }
          )
      }

      const animation = element.animate(keyframes, {
        duration: 600,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
    })
  }

  // Animation queuing system to prevent conflicts
  queueAnimation(animation: GridAnimationState): Promise<void> {
    return new Promise((resolve) => {
      this.animationQueue.push(animation)

      if (this.animationQueue.length === 1) {
        // Start processing queue
        this.processAnimationQueue()
      }

      // Resolve when this specific animation completes
      const originalResolve = resolve
      animation.config = {
        ...animation.config,
        onComplete: () => {
          originalResolve()
          animation.config.onComplete?.()
        }
      }
    })
  }

  private async processAnimationQueue() {
    while (this.animationQueue.length > 0) {
      const animation = this.animationQueue[0]

      try {
        await this.animateGridTransition(
          animation.element,
          animation.from,
          animation.to,
          animation.config
        )
      } catch (error) {
        console.warn('Animation failed:', error)
      }

      this.animationQueue.shift()
    }
  }

  // Utility methods
  isAnimating(element: HTMLElement): boolean {
    return this.activeAnimations.has(element)
  }

  cancelAnimation(element: HTMLElement): void {
    // Cancel any ongoing animation on element
    element.getAnimations().forEach(animation => {
      if (!animation.playState.includes('finished')) {
        animation.cancel()
      }
    })
    this.activeAnimations.delete(element)
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    activeAnimations: number
    queuedAnimations: number
    averageFrameRate: number
  } {
    return {
      activeAnimations: this.activeAnimations.size,
      queuedAnimations: this.animationQueue.length,
      averageFrameRate: this.calculateAverageFrameRate()
    }
  }

  private calculateAverageFrameRate(): number {
    // Simple FPS calculation based on animation performance
    const animations = document.querySelectorAll('.adaptive-grid')
    if (animations.length === 0) return 60

    let totalFPS = 0
    animations.forEach(el => {
      const rect = el.getBoundingClientRect()
      // Rough estimate based on layout complexity
      totalFPS += rect.width > 1000 ? 50 : 60
    })

    return totalFPS / animations.length
  }

  // Cleanup
  destroy(): void {
    this.observer?.disconnect()
    this.performanceObserver?.disconnect()
    this.activeAnimations.clear()
    this.animationQueue.length = 0
  }
}

// Global animation framework instance
let globalAnimationFramework: SmoothAnimationFramework | null = null

export function getAnimationFramework(): SmoothAnimationFramework {
  if (!globalAnimationFramework) {
    globalAnimationFramework = new SmoothAnimationFramework()
  }
  return globalAnimationFramework
}

// React hook for using animations
export function useGridAnimations() {
  const framework = getAnimationFramework()

  const animateTransition = (
    element: HTMLElement,
    fromState: string,
    toState: string,
    config?: Partial<AnimationConfig>
  ) => {
    return framework.animateGridTransition(element, fromState, toState, config)
  }

  const queueAnimation = (animation: GridAnimationState) => {
    return framework.queueAnimation(animation)
  }

  const isAnimating = (element: HTMLElement) => {
    return framework.isAnimating(element)
  }

  return {
    animateTransition,
    queueAnimation,
    isAnimating,
    performanceMetrics: framework.getPerformanceMetrics()
  }
}

// CSS-in-JS animation utilities
export const animationPresets = {
  smooth: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards' as const
  },
  quick: {
    duration: 150,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards' as const
  },
  bounce: {
    duration: 400,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    fill: 'forwards' as const
  },
  slow: {
    duration: 500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    fill: 'forwards' as const
  }
} as const

export type AnimationPreset = keyof typeof animationPresets