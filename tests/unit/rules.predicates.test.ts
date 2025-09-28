import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { envFlag, gates, hesitationDetected, isMobile, brandInDebugList, lowConfidence } from '@/lib/rules/predicates'
import type { CsrRuleContext, RagRuleContext, SsrRuleContext } from '@/lib/rules/types'

const OLD_ENV = { ...process.env }

describe('predicates.envFlag', () => {
  beforeEach(() => { process.env = { ...OLD_ENV } })
  afterEach(() => { process.env = { ...OLD_ENV } })

  it('parses common truthy values', () => {
    process.env.TEST_FLAG = '1'; expect(envFlag('TEST_FLAG', 'false')).toBe(true)
    process.env.TEST_FLAG = 'true'; expect(envFlag('TEST_FLAG', 'false')).toBe(true)
    process.env.TEST_FLAG = 'yes'; expect(envFlag('TEST_FLAG', 'false')).toBe(true)
    process.env.TEST_FLAG = 'on'; expect(envFlag('TEST_FLAG', 'false')).toBe(true)
  })

  it('falls back to default when env missing', () => {
    delete process.env.TEST_FLAG
    expect(envFlag('TEST_FLAG', 'true')).toBe(true)
    expect(envFlag('TEST_FLAG', 'false')).toBe(false)
  })
})

describe('predicates.gates', () => {
  beforeEach(() => { process.env = { ...OLD_ENV } })
  afterEach(() => { process.env = { ...OLD_ENV } })

  it('CSR gating depends on NEXT_PUBLIC_RULES_ENABLED', () => {
    const ctx = { scope: 'csr', consentGranted: true, device: 'desktop', debugBrands: [] } as unknown as CsrRuleContext
    process.env.NEXT_PUBLIC_RULES_ENABLED = 'false'
    expect(gates.rulesEnabledCSR(ctx)).toBe(false)
    process.env.NEXT_PUBLIC_RULES_ENABLED = 'true'
    expect(gates.rulesEnabledCSR(ctx)).toBe(true)
  })

  it('RAG gating depends on RULES_ENABLED and RULES_RAG_LOW_CONFIDENCE', () => {
    const ctx = { scope: 'rag', intentId: 'x', confidence: 0.1, messagePreview: '', thresholdLowConfidence: 0.5 } as RagRuleContext
    process.env.RULES_ENABLED = 'false'
    expect(gates.rulesEnabledRAG(ctx)).toBe(false)
    process.env.RULES_ENABLED = 'true'
    expect(gates.rulesEnabledRAG(ctx)).toBe(true)
    expect(gates.ragLowConfidence(ctx)).toBe(true) // default true
  })
})

describe('hesitationDetected', () => {
  it('returns false when window is undefined (server)', () => {
    expect(hesitationDetected({} as unknown as CsrRuleContext)).toBe(false)
  })
})

describe('more predicates', () => {
  const OLD_ENV = { ...process.env }
  beforeEach(() => { process.env = { ...OLD_ENV } })
  afterEach(() => { process.env = { ...OLD_ENV } })

  it('rulesEnabledSSR respects RULES_ENABLED', () => {
    const ssr = { scope: 'ssr', hasCampaign: false } as unknown as SsrRuleContext
    process.env.RULES_ENABLED = 'false'
    expect(gates.rulesEnabledSSR(ssr)).toBe(false)
    process.env.RULES_ENABLED = 'true'
    expect(gates.rulesEnabledSSR(ssr)).toBe(true)
  })

  it('isMobile detects mobile device', () => {
    const csr = { scope: 'csr', consentGranted: true, device: 'mobile', debugBrands: [] } as CsrRuleContext
    expect(gates.rulesEnabledCSR(csr)).toBe(false) // default disabled
    expect(isMobile(csr)).toBe(true)
  })

  it('brandInDebugList matches case-insensitive entries', () => {
    const csr = { scope: 'csr', consentGranted: true, device: 'desktop', debugBrands: ['TMobile'] , brandSlug: 'tmobile' } as unknown as CsrRuleContext
    expect(brandInDebugList(csr)).toBe(true)
  })

  it('lowConfidence uses threshold', () => {
    const rag = { scope: 'rag', intentId: 'x', confidence: 0.3, messagePreview: '', thresholdLowConfidence: 0.44 } as RagRuleContext
    expect(lowConfidence(rag)).toBe(true)
    rag.confidence = 0.5
    expect(lowConfidence(rag)).toBe(false)
  })
})
