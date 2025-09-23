"use client";
// CTA Telemetry: listens for clicks on anchors with data-cta-* attributes and pushes GTM events.
// Consent-gated: respects window.hretheumConsent.behavioral if present; falls back to NEXT_PUBLIC_BEHAVIORAL_DEFAULT.
// All comments/docstrings in English per project rules.

import React, { useEffect } from 'react'

export default function CtaTelemetry() {
  const gtmEnabled = (process.env.NEXT_PUBLIC_ENABLE_GTM ?? 'true') !== 'false'
  const apexDomain = (process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com').toLowerCase()
  const defaultBehavioral = (process.env.NEXT_PUBLIC_BEHAVIORAL_DEFAULT || 'allow').toLowerCase()

  function hasBehavioralConsent(): boolean {
    try {
      const w: any = window
      if (w && w.hretheumConsent && typeof w.hretheumConsent.behavioral === 'boolean') {
        return !!w.hretheumConsent.behavioral
      }
      const ls = window.localStorage.getItem('hretheum:consent:behavioral')
      if (ls === '1' || ls === 'true') return true
      if (ls === '0' || ls === 'false') return false
    } catch {}
    // fallback to env default (allow/deny)
    return defaultBehavioral !== 'deny'
  }

  function dlPush(payload: Record<string, any>) {
    if (!gtmEnabled) return
    try {
      if (!payload || !payload.event) return
      ;(window as any).dataLayer = (window as any).dataLayer || []
      ;(window as any).dataLayer.push(payload)
    } catch {}
  }

  function deriveBrandAndSource(): { brand?: string; source?: 'subdomain' | 'brand-route' } {
    try {
      const host = window.location.hostname.toLowerCase()
      if (host.endsWith('.' + apexDomain)) {
        const sub = host.slice(0, -('.' + apexDomain).length)
        if (sub && sub !== 'www') return { brand: sub, source: 'subdomain' }
      }
      const m = (window.location.pathname || '').match(/\/brand\/([a-z0-9-]+)/i)
      if (m && m[1]) return { brand: m[1].toLowerCase(), source: 'brand-route' }
      return { brand: undefined, source: 'brand-route' }
    } catch {
      return { brand: undefined, source: undefined }
    }
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null
        if (!target) return
        const link = target.closest('a[data-cta-id]') as HTMLAnchorElement | null
        if (!link) return
        if (!hasBehavioralConsent()) return
        const { brand, source } = deriveBrandAndSource()
        const id = link.getAttribute('data-cta-id') || 'cta'
        const ctaSource = link.getAttribute('data-cta-source') || 'unknown'
        const variant = link.getAttribute('data-cta-variant') || 'secondary'
        dlPush({
          event: 'ui.click',
          target_id: id,
          cta_source: ctaSource,
          cta_variant: variant,
          route: window.location.pathname,
          brand: brand || null,
          campaign_source: source || null,
        })
      } catch {}
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
