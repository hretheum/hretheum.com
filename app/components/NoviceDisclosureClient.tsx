// All comments/docstrings in English per policy.
'use client'
import React, { useEffect } from 'react'
import { useAdaptiveRules } from '@/app/components/useAdaptiveRules'

/**
 * NoviceDisclosureClient applies a body class when CSR rules enable novice disclosure.
 * This allows CSS-driven progressive disclosure without heavy JS.
 */
export default function NoviceDisclosureClient() {
  const { csr } = useAdaptiveRules()

  useEffect(() => {
    try {
      const enable = !!csr?.effects?.ui?.noviceDisclosure
      const body = document.body
      if (!body) return
      const cls = 'hre-novice-disclosure'
      if (enable) body.classList.add(cls)
      else body.classList.remove(cls)
    } catch {}
  }, [csr])

  return null
}
