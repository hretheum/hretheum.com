"use client";
// CTA Telemetry: listens for clicks on anchors with data-cta-* attributes and pushes GTM events.
// Consent-gated: respects window.hretheumConsent.behavioral if present; falls back to NEXT_PUBLIC_BEHAVIORAL_DEFAULT.
// All comments/docstrings in English per project rules.

import React, { useEffect } from 'react'

export default function CtaTelemetry() {
  const gtmEnabled = (process.env.NEXT_PUBLIC_ENABLE_GTM ?? 'true') !== 'false'
  const apexDomain = (process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com').toLowerCase()
  const defaultBehavioral = (process.env.NEXT_PUBLIC_BEHAVIORAL_DEFAULT || 'allow').toLowerCase()
  const debug = (process.env.NEXT_PUBLIC_TELEMETRY_DEBUG || 'false').toLowerCase() === 'true'

  function hasBehavioralConsent(): boolean {
    try {
      const w: any = window
      if (debug) return true
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
    // Optional debug heartbeat on mount
    try {
      if (debug) {
        const { brand, source } = deriveBrandAndSource()
        dlPush({
          event: 'ui.telemetry_ready',
          host: typeof window !== 'undefined' ? window.location.hostname : null,
          route: typeof window !== 'undefined' ? window.location.pathname : null,
          brand: brand || null,
          campaign_source: source || null,
        })
        // eslint-disable-next-line no-console
        console.info('[CtaTelemetry] ready', { brand, source })
      }
    } catch {}

    let lastPushTs = 0
    let lastPushId = ''

    const handle = (e: Event) => {
      try {
        let node = (e.target as Node) || null
        if (!node) return
        // If text node, move to parent element
        if ((node as any).nodeType === 3 && (node as any).parentElement) {
          node = (node as any).parentElement as Element
        }
        let link: HTMLAnchorElement | null = null
        if (node && (node as any).closest) {
          link = (node as any).closest('a[data-cta-id]') as HTMLAnchorElement | null
        } else {
          // Fallback traversal if closest() not available
          let el: any = node
          while (el && el !== document) {
            if (el.tagName === 'A' && el.hasAttribute && el.hasAttribute('data-cta-id')) {
              link = el as HTMLAnchorElement
              break
            }
            el = el.parentElement || el.parentNode
          }
        }
        if (!link) return
        if ((link as any).getAttribute && (link as any).getAttribute('data-cta-sent') === '1') return
        if (!hasBehavioralConsent()) return
        const { brand, source } = deriveBrandAndSource()
        const id = link.getAttribute('data-cta-id') || 'cta'
        const ctaSource = link.getAttribute('data-cta-source') || 'unknown'
        const variant = link.getAttribute('data-cta-variant') || 'secondary'
        const now = Date.now()
        if (id === lastPushId && now - lastPushTs < 500) return
        dlPush({
          event: 'ui.click',
          target_id: id,
          cta_source: ctaSource,
          cta_variant: variant,
          route: window.location.pathname,
          brand: brand || null,
          campaign_source: source || null,
        })
        lastPushId = id
        lastPushTs = now
      } catch {}
    }
    // Intercept dataLayer pushes to synthesize ui.click from gtm.linkClick (fallback)
    try {
      const w: any = window
      w.dataLayer = w.dataLayer || []
      const dl: any = w.dataLayer
      if (!dl.__hrePatched) {
        const originalPush = dl.push.bind(dl)
        dl.__hrePatched = true
        dl.push = function (...args: any[]) {
          try {
            for (const ev of args) {
              if (ev && ev.event === 'gtm.linkClick') {
                const el = ev['gtm.element'] as Element | undefined
                const anchor = el ? (el.closest ? el.closest('a') : (el as any)) : null
                const id = anchor?.getAttribute?.('data-cta-id') || ''
                if (id) {
                  const ctaSource = anchor?.getAttribute?.('data-cta-source') || 'unknown'
                  const variant = anchor?.getAttribute?.('data-cta-variant') || 'secondary'
                  const { brand, source } = deriveBrandAndSource()
                  const now = Date.now()
                  if (!(id === lastPushId && now - lastPushTs < 500)) {
                    originalPush({
                      event: 'ui.click',
                      target_id: id,
                      cta_source: ctaSource,
                      cta_variant: variant,
                      route: window.location.pathname,
                      brand: brand || null,
                      campaign_source: source || null,
                    })
                    lastPushId = id
                    lastPushTs = now
                  }
                }
              }
            }
          } catch {}
          return originalPush(...args)
        }
      }
    } catch {}
    document.addEventListener('click', handle as any, true)
    document.addEventListener('pointerup', handle as any, true)
    document.addEventListener('mousedown', handle as any, true)
    document.addEventListener('touchstart', handle as any, { capture: true, passive: true } as any)
    return () => {
      document.removeEventListener('click', handle as any, true)
      document.removeEventListener('pointerup', handle as any, true)
      document.removeEventListener('mousedown', handle as any, true)
      document.removeEventListener('touchstart', handle as any, true as any)
    }
  }, [])

  return null
}
