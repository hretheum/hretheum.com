import { describe, it, expect } from 'vitest'
import { evaluateRagRules } from '@/lib/rules'
import { ragRules } from '@/config/rules'

const OLD_ENV = { ...process.env }

describe('RAG rules scenario', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV }
    process.env.RULES_ENABLED = 'true'
    process.env.RULES_RAG_LOW_CONFIDENCE = 'true'
  })
  afterEach(() => {
    process.env = { ...OLD_ENV }
  })

  it('flags low confidence and requests clarification', () => {
    const out = evaluateRagRules(ragRules, {
      intentId: 'retrieval_core.case_study',
      confidence: 0.3,
      messagePreview: 'show me case studies',
      brandSlug: 'tmobile',
      campaignSource: 'subdomain',
      campaignType: 'employer-subdomain',
      thresholdLowConfidence: 0.44,
    })

    expect(out.effects.lowConfidence).toBe(true)
    expect(out.effects.clarification).toBeTruthy()
    expect(typeof out.effects.clarification?.message).toBe('string')
  })
})
