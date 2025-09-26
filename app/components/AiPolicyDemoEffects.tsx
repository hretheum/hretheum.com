"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react'

// Demo-only UI for Active Mode. Listens to 'hre:ai-policy' CustomEvent
// and renders small, unobtrusive effects for safe actions.
// Supported actions: 'ui.tooltip', 'ui.show_how_it_works'
// Other actions are ignored (no-op) for now.

type AllowedAction =
  | 'ui.show_suggestions'
  | 'ui.tooltip'
  | 'ui.compress_above_fold'
  | 'ui.show_how_it_works'
  | 'ui.emphasize_case_studies'

type AiPolicyDetail = {
  source: 'ai'
  mode: 'active' | 'shadow'
  allowed_actions: string[]
  action: AllowedAction | null
  confidence: number
  intent_summary?: string
  total_ms: number
}

export default function AiPolicyDemoEffects() {
  const [policy, setPolicy] = useState<AiPolicyDetail | null>(null)
  const [ctaRect, setCtaRect] = useState<DOMRect | null>(null)
  const [visible, setVisible] = useState<boolean>(true)
  const hideTimer = useRef<number | null>(null)
  const isDemoEnabled = useMemo(() => true, [])

  const confidenceFloor = useMemo(() => {
    const raw = (process.env.NEXT_PUBLIC_RULES_AI_CONFIDENCE_FLOOR ?? '0.15') as string
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.15
  }, [])

  const autoHideMs = useMemo(() => {
    const raw = (process.env.NEXT_PUBLIC_RULES_AI_AUTOHIDE_MS ?? '6000') as string
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(1500, Math.min(30000, n)) : 6000
  }, [])

  function adaptCopyForUser(summary?: string, action?: AllowedAction): string {
    const s = String(summary || '').trim()
    if (!s) {
      if (action === 'ui.tooltip') return "Want a quick overview before you book? Here's a 30‑sec tip."
      return 'Here’s a quick summary to help you get started.'
    }
    // Basic person shift: third → second person
    let out = s
      .replace(/\b[Tt]he user\b/g, 'You')
      .replace(/\bU\ser\b/g, 'You')
      .replace(/\buser\b/g, 'you')
      .replace(/\busers\b/g, 'people')
      .replace(/\bthey\b/g, 'you')
      .replace(/\btheir\b/g, 'your')
      .replace(/\bthem\b/g, 'you')
      .replace(/\bis trying to\b/g, "you're trying to")
      .replace(/\bmay benefit from\b/g, 'can quickly check')
      .replace(/\bwould benefit from\b/g, 'can quickly check')
    // Keep it short
    if (out.length > 180) out = out.slice(0, 177) + '…'
    // Nudge into context for CTA
    if (action === 'ui.tooltip') {
      if (!/[.!?]$/.test(out)) out += '.'
      out += ' See how it works below.'
    }
    return out
  }

  function isVisibleInViewport(el: HTMLElement) {
    const r = el.getBoundingClientRect()
    return r.top >= 0 && r.left >= 0 && r.bottom <= (window.innerHeight || 0) && r.right <= (window.innerWidth || 0)
  }

  useEffect(() => {
    function onPolicy(e: Event) {
      const ev = e as CustomEvent<AiPolicyDetail>
      if (!ev?.detail || ev.detail.mode !== 'active') return
      // Show once per session to avoid repetition
      try {
        const shown = sessionStorage.getItem('aiPolicy_effect_shown')
        if (shown === '1') return
      } catch {}
      setPolicy(ev.detail)
      try { sessionStorage.setItem('aiPolicy_effect_shown', '1') } catch {}
    }
    document.addEventListener('hre:ai-policy', onPolicy)
    return () => document.removeEventListener('hre:ai-policy', onPolicy)
  }, [])

  useEffect(() => {
    if (!policy) return
    if (policy.action !== 'ui.tooltip') return
    // Try to locate primary CTA by data-cta-id; fallback to first button
    let target =
      (document.querySelector('[data-cta-id="brand_hero_cta"]') as HTMLElement | null) ||
      (document.querySelector('a[data-cta-source="brand_hero"]') as HTMLElement | null) ||
      (document.querySelector('a[href*="calendly" i]') as HTMLElement | null) ||
      (document.querySelector('a[role="button"]') as HTMLElement | null) ||
      (document.querySelector('button') as HTMLElement | null)
    // Prefer visible-in-viewport
    if (target && !isVisibleInViewport(target)) {
      const candidates = Array.from(document.querySelectorAll('a,button')) as HTMLElement[]
      target = candidates.find(isVisibleInViewport) || target
    }
    if (target) {
      const rect = target.getBoundingClientRect()
      setCtaRect(rect)
    } else {
      setCtaRect(null)
    }
    // Start auto-hide timer
    setVisible(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setVisible(false), autoHideMs)
    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
    }
  }, [policy, autoHideMs])

  if (!isDemoEnabled || !policy || policy.mode !== 'active' || !policy.action) return null

  // Confidence threshold to avoid jitter
  if ((policy.confidence ?? 0) < confidenceFloor) return null
  if (!visible) return null

  if (policy.action === 'ui.tooltip') {
    // Render a simple tooltip near CTA (viewport fixed positioning)
    const r = ctaRect
    const top = Math.max(16, (r?.top ?? 80) + (r?.height ?? 0) + 8)
    const left = Math.max(16, Math.min((r?.left ?? 24), window.innerWidth - 320))
    // Compose user-facing message
    const msg = adaptCopyForUser(policy.intent_summary, policy.action)
    return (
      <div style={{ position: 'fixed', top, left, zIndex: 60 }}>
        <div style={{
          maxWidth: 300,
          background: 'rgba(17,24,39,0.95)',
          color: 'white',
          borderRadius: 8,
          padding: '10px 12px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.25)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Tip</div>
          <div style={{ fontSize: 14, lineHeight: 1.35 }}>{msg}</div>
        </div>
      </div>
    )
  }

  if (policy.action === 'ui.show_how_it_works') {
    // Render a small How-it-works card bottom-right
    return (
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 60 }}>
        <div style={{
          width: 320,
          background: 'white',
          color: '#111827',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 20px 24px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>How it works</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.4 }}>
            <li>Pick your focus area (e.g., Case Studies).</li>
            <li>Explore examples tailored to your brand/industry.</li>
            <li>Book a short intro if it fits your needs.</li>
          </ol>
        </div>
      </div>
    )
  }

  if (policy.action === 'ui.show_suggestions') {
    // Suggestions panel bottom-right (same placement as How-it-works for consistency)
    // Use Calendly URL from env if present
    const calendly = (process.env.NEXT_PUBLIC_CALENDLY_URL || '#') as string
    const items = [
      { label: 'See case studies', href: '#case-studies' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Schedule a quick intro', href: calendly, target: '_blank', rel: 'noopener noreferrer' },
    ]
    return (
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 60 }}>
        <div style={{
          width: 320,
          background: 'white',
          color: '#111827',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 20px 24px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Suggestions</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((it) => (
              <li key={it.label} style={{ marginBottom: 6 }}>
                <a
                  href={it.href}
                  target={(it as any).target}
                  rel={(it as any).rel}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#111827',
                    textDecoration: 'none',
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                  }}
                >
                  <span>•</span>
                  <span>{it.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  // Other actions: no-op (for now)
  // Mark shown to avoid repeated popups
  try {
    sessionStorage.setItem('aiPolicy_effect_shown', '1')
  } catch {}
  return null
}
