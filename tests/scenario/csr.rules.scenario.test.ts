// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { evaluateCsrRules } from '@/lib/rules'
import { csrRules } from '@/config/rules'

const OLD_ENV = { ...process.env }

describe('CSR rules scenario', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV }
    // Enable CSR rules and features
    process.env.NEXT_PUBLIC_RULES_ENABLED = 'true'
    process.env.NEXT_PUBLIC_RULES_CSR_HESITATION_TOOLTIP = 'true'
    process.env.NEXT_PUBLIC_RULES_CSR_NOVICE_DISCLOSURE = 'true'
    // Simulate hesitation signal
    ;(globalThis as any).window = window
    ;(window as any).__hre_hesitation = true
  })
  afterEach(() => {
    process.env = { ...OLD_ENV }
    if ((window as any).__hre_hesitation) delete (window as any).__hre_hesitation
  })

  it('emits tooltip and novice disclosure effects when gated and consented', () => {
    const out = evaluateCsrRules(csrRules, {
      brandSlug: 'tmobile',
      route: '/brand/tmobile',
      consentGranted: true,
      device: 'desktop',
      debugBrands: [],
    })

    expect(out.effects.ui.tooltip).toBeTruthy()
    expect(out.effects.ui.tooltip?.target).toBe('primary_cta')
    expect(out.effects.ui.noviceDisclosure).toBe(true)
  })
})
