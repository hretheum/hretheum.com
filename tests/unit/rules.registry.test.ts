import { describe, it, expect } from 'vitest'
import { registerRules, getRules, resetRulesRegistry, defineRule, evaluateRulesGeneric } from '@/lib/rules'
import type { RuleDefinition, RuleContextBase, RuleActionBase } from '@/lib/rules'


type Ctx = RuleContextBase & { scope: 'csr' }
type Act = RuleActionBase & { type: 't' }

const act = (): Act => ({ type: 't' })

const rule: RuleDefinition<Ctx, Act> = defineRule({ id: 'r', scope: 'csr', conditions: [() => true], actions: [() => act()] })

describe('RuleRegistry', () => {
  it('registers and retrieves rules per scope', () => {
    resetRulesRegistry()
    registerRules('csr', [rule])
    const out = getRules('csr')
    expect(out.length).toBe(1)
    expect(out[0].id).toBe('r')
  })

  it('resets registry', () => {
    resetRulesRegistry()
    let out = getRules('csr')
    expect(out.length).toBe(0)
    registerRules('csr', [rule])
    resetRulesRegistry()
    out = getRules('csr')
    expect(out.length).toBe(0)
  })
})
