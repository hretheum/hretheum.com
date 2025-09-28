import { describe, it, expect } from 'vitest'
import { defineRule, evaluateSsrRules, ssrHeroUpdate } from '@/lib/rules'
import type { RuleDefinition, SsrRuleAction, SsrRuleContext } from '@/lib/rules'
import type { Industry } from '@/lib/industry'

const mkRule = (): RuleDefinition<SsrRuleContext, SsrRuleAction> =>
  defineRule<SsrRuleContext, SsrRuleAction>({
    id: 'ssr.hero.safe_update',
    scope: 'ssr',
    conditions: [() => true],
    actions: [
      ssrHeroUpdate({ heroHeadline: 'Signals for Telecom', showCtaOnMobile: false, accent: '#ff00aa', ctaLabel: 'Book a call' }),
    ],
  })

describe('SSR rules scenario', () => {
  it('applies safe hero effects with fallbacks', () => {
    const rules = [mkRule()]
    const out = evaluateSsrRules(rules, {
      slug: 'tmobile',
      industry: 'Telecom' as Industry,
      industrySource: 'mapping',
      confidence: 0.91,
      hasCampaign: false,
      defaultHeroHeadline: 'Default Headline',
      defaultShowCtaOnMobile: true,
      defaultAccent: '#00ffaa',
    })

    expect(out.effects.hero.heroHeadline).toBe('Signals for Telecom')
    expect(out.effects.hero.showCtaOnMobile).toBe(false)
    expect(out.effects.hero.accent).toBe('#ff00aa')
    expect(out.effects.hero.ctaLabel).toBe('Book a call')

    expect(out.metrics.evaluated).toBe(1)
    expect(out.metrics.matched).toBe(1)
    expect(out.metrics.actions).toBe(1)
  })
})
