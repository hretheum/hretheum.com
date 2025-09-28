// All comments/docstrings in English per policy.
'use client'
import React, { useEffect, useRef } from 'react'

/**
 * HesitationFlagClient sets a transient CSR flag when the user appears hesitant (idle without interaction).
 * The flag is read by predicates.hesitationDetected() used in CSR rules.
 *
 * Behavior:
 * - After `idleMs` of no interaction (mouse/scroll/keydown/touch), set window.__hre_hesitation = true
 * - On any interaction, clear the flag and restart the timer
 * - Consent is enforced at rule level; this component only toggles a volatile flag
 */
export default function HesitationFlagClient({ idleMs = 2500 }: { idleMs?: number }) {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true
    const setFlag = (v: boolean) => {
      try { ;(window as any).__hre_hesitation = v } catch {}
    }
    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
    const startTimer = () => {
      clearTimer()
      timerRef.current = window.setTimeout(() => setFlag(true), Math.max(500, idleMs)) as unknown as number
    }
    const onActivity = () => {
      setFlag(false)
      startTimer()
    }

    // Initialize
    setFlag(false)
    startTimer()

    // Bind listeners for common interactions
    const opts: AddEventListenerOptions | boolean = { capture: true, passive: true }
    window.addEventListener('mousemove', onActivity, opts)
    window.addEventListener('scroll', onActivity, opts)
    window.addEventListener('keydown', onActivity as any, true)
    window.addEventListener('touchstart', onActivity as any, { capture: true, passive: true } as any)

    return () => {
      mounted = false
      clearTimer()
      setFlag(false)
      window.removeEventListener('mousemove', onActivity, true as any)
      window.removeEventListener('scroll', onActivity, true as any)
      window.removeEventListener('keydown', onActivity as any, true)
      window.removeEventListener('touchstart', onActivity as any, true)
    }
  }, [idleMs])

  return null
}
