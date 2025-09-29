"use client";
// All comments/docstrings in English per policy.
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Defer non-critical components to reduce initial bundle
const AiPolicyClient = dynamic(() => import('@/app/components/AiPolicyClient'), { ssr: false })
const AiPolicyDemoEffects = dynamic(() => import('@/app/components/AiPolicyDemoEffects'), { ssr: false })
const MainCtaTooltipClient = dynamic(() => import('@/app/components/MainCtaTooltipClient'), { ssr: false })
const ChaosModeClient = dynamic(() => import('@/app/components/ChaosModeClient'), { ssr: false })
const MermaidGlobalConfig = dynamic(() => import('@/app/components/MermaidGlobalConfig'), { ssr: false })
const HesitationFlagClient = dynamic(() => import('@/app/components/HesitationFlagClient'), { ssr: false })
const NoviceDisclosureClient = dynamic(() => import('@/app/components/NoviceDisclosureClient'), { ssr: false })

export default function ClientGlobals() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    // Defer loading until after initial render
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
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
