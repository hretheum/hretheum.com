"use client";
// RUM: Web Vitals with consent gating. Pushes to GTM dataLayer and optional API.
// All comments/docstrings in English per policy.

import { useEffect } from 'react'

function dlPush(payload: Record<string, any>) {
  try {
    if (!payload || !payload.event) return
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).dataLayer.push(payload)
  } catch {}
}

function hasBehavioralConsent(defaultBehavioral: string): boolean {
  try {
    const w: any = window
    if (w && w.hretheumConsent && typeof w.hretheumConsent.behavioral === 'boolean') {
      return !!w.hretheumConsent.behavioral
    }
    const ls = window.localStorage.getItem('hretheum:consent:behavioral')
    if (ls === '1' || ls === 'true') return true
    if (ls === '0' || ls === 'false') return false
  } catch {}
  return defaultBehavioral !== 'deny'
}

function deriveBrandAndSource(apexDomain: string): { brand?: string; source?: 'subdomain' | 'brand-route' } {
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

export default function RumVitals() {
  const gtmEnabled = (process.env.NEXT_PUBLIC_ENABLE_GTM ?? 'true') !== 'false'
  const apexDomain = (process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com').toLowerCase()
  const defaultBehavioral = (process.env.NEXT_PUBLIC_BEHAVIORAL_DEFAULT || 'allow').toLowerCase()
  const apiEnabled = (process.env.NEXT_PUBLIC_RUM_API_ENABLED ?? 'true') !== 'false'
  const samplePct = Math.max(0, Math.min(1, Number(process.env.NEXT_PUBLIC_RUM_SAMPLE_PCT || '0.3')))

  useEffect(() => {
    // Simple session sampling to avoid over-reporting
    let sampled = false
    try {
      const KEY = 'hretheum:rum:sampled'
      const existing = window.sessionStorage.getItem(KEY)
      if (existing === '1') sampled = true
      else if (Math.random() < samplePct) {
        sampled = true
        window.sessionStorage.setItem(KEY, '1')
      }
    } catch {}

    if (!sampled) return
    if (!hasBehavioralConsent(defaultBehavioral)) return

    const { brand, source } = deriveBrandAndSource(apexDomain)

    // Dynamically import web-vitals to keep initial bundle lean
    import('web-vitals').then(({ onCLS, onLCP, onINP, onFCP, onTTFB }) => {
      const handler = (metric: any) => {
        try {
          const payload = {
            event: 'web_vitals',
            route: window.location.pathname,
            brand: brand || null,
            campaign_source: source || null,
            id: metric.id,
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
          }
          if (gtmEnabled) dlPush(payload)
          if (apiEnabled) {
            fetch('/api/metrics/rum', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(payload),
              keepalive: true,
            }).catch(() => {})
          }
        } catch {}
      }
      onCLS(handler)
      onLCP(handler)
      onINP(handler)
      onFCP(handler)
      onTTFB(handler)
    })
  }, [apexDomain, defaultBehavioral, gtmEnabled, apiEnabled, samplePct])

  return null
}
