"use client";
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useConsent } from '@/app/hooks/useConsent'
import { evaluateCsrRules } from '@/lib/rules'
import { csrRules } from '@/config/rules'

export type AiPolicyResult = {
  source: 'ai'
  mode: 'shadow' | 'active'
  allowed_actions: string[]
  action: string | null
  confidence: number
  intent_summary?: string
  total_ms: number
}

export function useAdaptiveRules() {
  const pathname = usePathname()
  const { behavioral: consent } = useConsent()
  const [ai, setAi] = useState<AiPolicyResult | null>(null)
  const [csr, setCsr] = useState<ReturnType<typeof evaluateCsrRules> | null>(null)

  const isEnabled = useMemo(() => {
    const v = String(process.env.NEXT_PUBLIC_RULES_AI_ENABLED ?? 'true').toLowerCase()
    return v !== 'false'
  }, [])

  useEffect(() => {
    let aborted = false
    async function run() {
      try {
        if (!isEnabled) return
        // Consent gating: do not call policy without behavioral consent
        if (!consent) return
        // Build a minimal session summary; engagement fields are optional
        const summary: any = {
          route: pathname || '/',
          consent: !!consent,
          device: typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        }
        // Demo mode: enrich summary to increase likelihood of a visible safe action
        const demoEnv = String(process.env.NEXT_PUBLIC_RULES_AI_DEMO ?? 'false').toLowerCase() === 'true'
        const demoParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('aiDemo')
        if (demoEnv || demoParam) {
          summary.engagement = { hesitation_ms: 3000, dwell_ms: 15000, cta_clicks: { brand_hero_cta: 0 } }
          summary.rag = { intent: 'retrieval_core.case_study', confidence: 0.3, lowConfidence: true }
        }
        const res = await fetch('/api/decision/policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary }),
        })
        if (!res.ok) return
        const data = (await res.json()) as AiPolicyResult
        if (!aborted) setAi(data)
      } catch {}
    }
    run()
    return () => {
      aborted = true
    }
  }, [pathname, consent, isEnabled])

  // Evaluate deterministic CSR rules (T14) alongside AI policy.
  useEffect(() => {
    // Build CSR context and evaluate whenever route/consent changes
    const brandSlug = (() => {
      try {
        const p = pathname || '/'
        const m = p.match(/^\/brand\/(\w[\w-]*)/)
        return m ? m[1] : undefined
      } catch { return undefined }
    })()
    const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)
    const effects = evaluateCsrRules(csrRules, {
      brandSlug,
      route: pathname || '/',
      consentGranted: !!consent,
      device: isMobile ? 'mobile' : 'desktop',
      debugBrands: [],
    }, false)
    setCsr(effects)
  }, [pathname, consent])

  return { ai, csr }
}
