"use client";
import React, { useEffect } from 'react'
import { useAdaptiveRules } from '@/app/components/useAdaptiveRules'

/**
 * AiPolicyClient mounts globally and fetches AI policy recommendations.
 * Shadow mode: console.info only.
 * Active mode: emits a CustomEvent 'hre:ai-policy' with the recommended action.
 */
export default function AiPolicyClient() {
  const { ai } = useAdaptiveRules()

  useEffect(() => {
    if (!ai) return
    if (ai.mode === 'shadow') {
      if (process.env.NEXT_PUBLIC_TELEMETRY_DEBUG !== 'false') {
        const logger = globalThis.console
        logger?.info?.('[ai-policy:shadow]', ai)
      }
      return
    }
    // Active mode: dispatch a document-level event for interested components
    try {
      const ev = new CustomEvent('hre:ai-policy', { detail: ai })
      document.dispatchEvent(ev)
    } catch {}
  }, [ai])

  return null
}
