"use client";
// All comments/docstrings in English per policy.
import React from 'react'
import AiPolicyClient from '@/app/components/AiPolicyClient'
import AiPolicyDemoEffects from '@/app/components/AiPolicyDemoEffects'
import MainCtaTooltipClient from '@/app/components/MainCtaTooltipClient'
import ChaosModeClient from '@/app/components/ChaosModeClient'

export default function ClientGlobals() {
  return (
    <>
      {/* Adaptive AI policy (shadow→active). CSR-only and consent-gated via useAdaptiveRules. */}
      <AiPolicyClient />
      {/* Demo effects for Active Mode (safe actions only) */}
      <AiPolicyDemoEffects />
      {/* Global main CTA tooltip renderer (deterministic CSR rules) */}
      <MainCtaTooltipClient />
      {/* Chaos Mode effects (flagged via NEXT_PUBLIC_CHAOS_MODE) */}
      <ChaosModeClient />
    </>
  )
}
