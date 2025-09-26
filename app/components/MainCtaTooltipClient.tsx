"use client";
// All comments/docstrings in English per policy.
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAdaptiveRules } from '@/app/components/useAdaptiveRules'

function findMainCta(): HTMLAnchorElement | null {
  try {
    // Prefer hero CTA on brand page (by id or source), regardless of variant
    let el =
      document.querySelector<HTMLAnchorElement>('a[data-cta-id="brand_hero_cta"]') ||
      document.querySelector<HTMLAnchorElement>('a[data-cta-source="brand_hero"][data-cta-variant="primary"]') ||
      document.querySelector<HTMLAnchorElement>('a[data-cta-source="brand_hero"]')
    if (el) return el
    // Fallback: any primary CTA in view order
    el = document.querySelector<HTMLAnchorElement>('a[data-cta-variant="primary"]')
    if (el) return el
    // Fallback: closing banner
    el = document.querySelector<HTMLAnchorElement>('a[data-cta-source="closing_banner"][data-cta-variant="primary"]')
    if (el) return el
  } catch {}
  return null
}

export default function MainCtaTooltipClient() {
  const pathname = usePathname()
  const { csr } = useAdaptiveRules()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const retryTimerRef = useRef<number | null>(null)
  const retryCountRef = useRef<number>(0)
  const anchorRef = useRef<HTMLAnchorElement | null>(null)

  const tooltipAllowed = useMemo(() => {
    try {
      // Gate by env flag: NEXT_PUBLIC_RULES_ENABLED
      const val = String(process.env.NEXT_PUBLIC_RULES_ENABLED ?? 'false').toLowerCase()
      return val === 'true' || val === '1'
    } catch { return false }
  }, [])

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || !tooltipAllowed) return
    // Read effect from rules
    const tip = csr?.effects?.ui?.tooltip
    if (!tip || !tip.message) {
      setVisible(false)
      return
    }
    setMessage(tip.message)

    // Locate anchor and compute position
    const ensureAnchor = () => {
      const anchor = findMainCta()
      anchorRef.current = anchor
      if (!anchor) {
        // Retry up to ~5s (25 * 200ms)
        if (retryCountRef.current < 25) {
          retryCountRef.current += 1
          retryTimerRef.current = window.setTimeout(ensureAnchor, 200) as unknown as number
        } else {
          setVisible(false)
        }
        return
      }
      // Once anchor found, compute and attach listeners
      const compute = () => {
        try {
          const rect = anchor.getBoundingClientRect()
          const top = Math.max(8, rect.top + window.scrollY - 40)
          const left = rect.left + window.scrollX + rect.width / 2
          setPos({ top, left })
          setVisible(true)
        } catch {}
      }
      compute()
      const onScroll = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(compute)
      }
      const onResize = onScroll
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
      // Auto-hide after 8s, but keep recalculating position
      const hideTimer = window.setTimeout(() => setVisible(false), 8000)
      // Cleanup when effect deps change
      return () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        window.clearTimeout(hideTimer)
      }
    }
    const cleanup = ensureAnchor()

    return () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
      retryCountRef.current = 0
      if (typeof cleanup === 'function') cleanup()
    }
  }, [mounted, tooltipAllowed, csr, pathname])

  if (!mounted || !tooltipAllowed || !visible || !pos) return null

  return (
    <div
      role="tooltip"
      aria-live="polite"
      className="pointer-events-none fixed z-[1000] -translate-x-1/2"
      style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
    >
      <div className="rounded-md border bg-white/95 backdrop-blur text-gray-900 text-xs shadow-lg px-3 py-2">
        {message}
      </div>
      <div className="mx-auto w-2 h-2 rotate-45 -mt-1 bg-white/95 border border-t-0 border-l-0" />
    </div>
  )
}
