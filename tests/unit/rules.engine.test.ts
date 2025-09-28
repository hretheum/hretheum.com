import { describe, it, expect } from 'vitest'
import { evaluateRulesGeneric } from '@/lib/rules/engine'
import type { RuleDefinition, RuleContextBase, RuleActionBase } from '@/lib/rules/types'

type Ctx = RuleContextBase & { scope: 'csr'; flag?: boolean }
type Act = RuleActionBase & { type: 't' }

const act = (): Act => ({ type: 't' })

describe('evaluateRulesGeneric', () => {
  it('evaluates conditions in priority order and emits actions', () => {
    const rules: RuleDefinition<Ctx, Act>[] = [
      { id: 'r2', scope: 'csr', priority: 200, conditions: [() => true], actions: [() => act()] },
      { id: 'r1', scope: 'csr', priority: 100, conditions: [() => true], actions: [() => act()] },
    ]
    const out = evaluateRulesGeneric<Ctx, Act>(rules, { scope: 'csr' })
    expect(out.metrics.evaluated).toBe(2)
    expect(out.actions.length).toBe(2)
    // r1 should match before r2 due to lower priority
    expect(out.actions[0].ruleId).toBe('r1')
    expect(out.actions[1].ruleId).toBe('r2')
  })

  it('stops at maxActions', () => {
    const rules: RuleDefinition<Ctx, Act>[] = [
      { id: 'r1', scope: 'csr', conditions: [() => true], actions: [() => act(), () => act()] },
      { id: 'r2', scope: 'csr', conditions: [() => true], actions: [() => act()] },
    ]
    const out = evaluateRulesGeneric<Ctx, Act>(rules, { scope: 'csr' }, { maxActions: 2 })
    expect(out.actions.length).toBe(2)
  })

  it('handles condition/action errors and continues', () => {
    const rules: RuleDefinition<Ctx, Act>[] = [
      { id: 'r1', scope: 'csr', conditions: [() => { throw new Error('x') }], actions: [() => act()] },
      { id: 'r2', scope: 'csr', conditions: [() => true], actions: [() => { throw new Error('y'); return act() }] },
      { id: 'r3', scope: 'csr', conditions: [() => true], actions: [() => act()] },
    ]
    const out = evaluateRulesGeneric<Ctx, Act>(rules, { scope: 'csr' }, { debug: true })
    expect(out.metrics.evaluated).toBe(3)
    expect(out.actions.length).toBe(1)
    expect(out.actions[0].ruleId).toBe('r3')
    expect(out.debugLog && out.debugLog.length).toBeGreaterThan(0)
  })
})
