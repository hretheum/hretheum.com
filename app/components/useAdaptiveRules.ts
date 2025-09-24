"use client";
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useConsent } from '@/app/hooks/useConsent'

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
        const summary = {
          route: pathname || '/',
          consent: !!consent,
          device: typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
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

  return { ai }
}
