"use client";
// All comments/docstrings in English per policy.
import React from 'react'
import AiPolicyClient from '@/app/components/AiPolicyClient'
import AiPolicyDemoEffects from '@/app/components/AiPolicyDemoEffects'
import MainCtaTooltipClient from '@/app/components/MainCtaTooltipClient'
import ChaosModeClient from '@/app/components/ChaosModeClient'
import MermaidGlobalConfig from '@/app/components/MermaidGlobalConfig'
import HesitationFlagClient from '@/app/components/HesitationFlagClient'
import NoviceDisclosureClient from '@/app/components/NoviceDisclosureClient'

export default function ClientGlobals() {
  return (
    <>
      {/* Adaptive AI policy (shadow→active). CSR-only and consent-gated via useAdaptiveRules. */}
      <AiPolicyClient />
      {/* Demo effects for Active Mode (safe actions only) */}
      <AiPolicyDemoEffects />
      {/* Global main CTA tooltip renderer (deterministic CSR rules) */}
      <MainCtaTooltipClient />
      {/* CSR hesitation signal flagger (idle-based) */}
      <HesitationFlagClient />
      {/* CSR novice disclosure consumer (applies body class) */}
      <NoviceDisclosureClient />
      {/* Chaos Mode effects (flagged via NEXT_PUBLIC_CHAOS_MODE) */}
      <ChaosModeClient />
      {/* Mermaid global config: silence overlay, keep console logs only */}
      <MermaidGlobalConfig />
    </>
  )
}
