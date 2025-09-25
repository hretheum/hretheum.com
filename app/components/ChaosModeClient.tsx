"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useConsent } from '@/app/hooks/useConsent'

// Chaos Mode: small visual nudges on CTA-like elements
// - Controlled via NEXT_PUBLIC_CHAOS_* flags
// - Respects consent if NEXT_PUBLIC_CHAOS_REQUIRE_CONSENT=true
// - Caps effects per minute, prefers visible CTAs in viewport
// - Avoids CLS: overlays are positioned fixed and do not shift layout
// - Respects prefers-reduced-motion

interface EffectItem {
  id: number
  kind: 'pulse' | 'tip'
  rect: DOMRect
  text?: string
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function isVisibleInViewport(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  const vw = window.innerWidth || 0
  const vh = window.innerHeight || 0
  return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export default function ChaosModeClient() {
  const enabled = String(process.env.NEXT_PUBLIC_CHAOS_MODE ?? 'false').toLowerCase() === 'true'
  const requireConsent = String(process.env.NEXT_PUBLIC_CHAOS_REQUIRE_CONSENT ?? 'true').toLowerCase() !== 'false'
  const intensity = clamp(Number(process.env.NEXT_PUBLIC_CHAOS_INTENSITY ?? '0.3'), 0, 1)
  const maxPerMin = clamp(Number(process.env.NEXT_PUBLIC_CHAOS_MAX_EFFECTS_PER_MIN ?? '3'), 0, 10)
  const debug = String(process.env.NEXT_PUBLIC_CHAOS_DEBUG ?? 'false').toLowerCase() === 'true'

  const { behavioral } = useConsent()
  const [effects, setEffects] = useState<EffectItem[]>([])
  const idRef = useRef(1)
  const history = useRef<number[]>([])
  const recentTargets = useRef<WeakSet<Element>>(new WeakSet())
  const rafRef = useRef<number | null>(null)

  const targetSelectors = useMemo(() => {
    const extra = (process.env.NEXT_PUBLIC_CHAOS_TARGETS || 'brand_hero_cta')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((id) => `[data-cta-id="${id}"]`)
      .join(',')
    const base = [
      '[data-cta-id]',
      '[data-cta-source]',
      'a[href*="calendly" i]',
      'a[role="button"]',
      'button',
      'a.btn, button.btn',
      'a[href^="mailto:"]',
      'a[href^="tel:"]',
    ]
    return (extra ? [extra, ...base] : base).join(',')
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (requireConsent && !behavioral) return
    if (prefersReducedMotion()) return

    const tick = () => {
      // Maintain sliding window of 60s
      const now = Date.now()
      history.current = history.current.filter((t) => now - t < 60_000)
      if (history.current.length >= maxPerMin) return
      if (Math.random() > intensity) return

      // Find CTA-like targets
      let nodes = Array.from(document.querySelectorAll(targetSelectors)) as HTMLElement[]
      nodes = nodes.filter((el) => {
        try {
          return isVisibleInViewport(el) && !recentTargets.current.has(el)
        } catch {
          return false
        }
      })
      if (nodes.length === 0) return

      // Prefer larger clickable items
      nodes.sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))
      const target = nodes[Math.floor(Math.random() * Math.min(nodes.length, 5))]
      if (!target) return

      const rect = target.getBoundingClientRect()
      recentTargets.current.add(target)

      // Decide effect kind
      const kind: EffectItem['kind'] = Math.random() < 0.6 ? 'pulse' : 'tip'
      const text = kind === 'tip' ? "Take a quick look here." : undefined
      const id = idRef.current++
      const item: EffectItem = { id, kind, rect, text }
      setEffects((prev) => [...prev, item])
      history.current.push(now)

      // Auto remove after duration
      window.setTimeout(() => {
        setEffects((prev) => prev.filter((e) => e.id !== id))
      }, kind === 'pulse' ? 1800 : 3500)
    }

    // Variable interval around 10s for less predictability
    const interval = window.setInterval(tick, 10_000)
    if (debug) console.info('[chaos] started', { intensity, maxPerMin })
    return () => {
      window.clearInterval(interval)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, behavioral, requireConsent, intensity, maxPerMin, targetSelectors, debug])

  // Reposition overlays on scroll/resize to keep aligned for short lifetime
  useEffect(() => {
    if (effects.length === 0) return
    const update = () => {
      setEffects((prev) => prev.map((e) => {
        // Attempt to nudge position a bit to reflect current scroll
        return { ...e }
      }))
      rafRef.current = requestAnimationFrame(update)
    }
    rafRef.current = requestAnimationFrame(update)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [effects.length])

  if (!enabled) return null
  if (requireConsent && !behavioral) return null
  if (effects.length === 0) return null

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 70 }}>
      {effects.map((e) => {
        const r = e.rect
        const top = Math.max(0, r.top + (r.height > 0 ? 0 : 0))
        const left = Math.max(0, r.left)
        const width = Math.max(24, r.width)
        const height = Math.max(24, r.height)

        if (e.kind === 'pulse') {
          const size = Math.max(width, height) + 16
          return (
            <div key={e.id} style={{ position: 'fixed', top: top + height / 2 - size / 2, left: left + width / 2 - size / 2, width: size, height: size, borderRadius: size, boxShadow: '0 0 0 0 rgba(59,130,246,0.45)', transform: 'scale(1)', animation: 'hre-pulse 1.2s ease-out 1', }} />
          )
        }
        // tip
        const tipTop = Math.min(window.innerHeight - 48, top + height + 8)
        const tipLeft = Math.min(window.innerWidth - 280, Math.max(8, left))
        return (
          <div key={e.id} style={{ position: 'fixed', top: tipTop, left: tipLeft, maxWidth: 260, background: 'rgba(17,24,39,0.95)', color: '#fff', borderRadius: 8, padding: '8px 10px', boxShadow: '0 10px 20px rgba(0,0,0,0.25)' }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Tip</div>
            <div style={{ fontSize: 13, lineHeight: 1.35 }}>{e.text}</div>
          </div>
        )
      })}
      {/* Inline keyframes for pulse */}
      <style>{`
        @keyframes hre-pulse {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.45); transform: scale(0.96); }
          70% { box-shadow: 0 0 0 8px rgba(59,130,246,0.15); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.0); transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
