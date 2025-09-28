import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { evaluateRulesGeneric } from '@/lib/rules/engine'
import type { RuleDefinition, RuleContextBase, RuleActionBase } from '@/lib/rules/types'

type Ctx = RuleContextBase & { scope: 'rag' }
type Act = RuleActionBase & { type: 't' }

const mkRule = (id: string): RuleDefinition<Ctx, Act> => ({ id, scope: 'rag', conditions: [() => true], actions: [() => ({ type: 't' })] })

const OLD_ENV = { ...process.env }

describe('rules.eval telemetry', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV }
  })
  afterEach(() => {
    process.env = { ...OLD_ENV }
  })

  it('emits when enabled', () => {
    process.env.RULES_TELEMETRY_ENABLED = 'true'
    process.env.RULES_TELEMETRY_SAMPLE_RATE = '1'
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const out = evaluateRulesGeneric<Ctx, Act>([mkRule('a'), mkRule('b')], { scope: 'rag' })
    expect(out.metrics.evaluated).toBe(2)
    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })

  it('does not emit when disabled', () => {
    process.env.RULES_TELEMETRY_ENABLED = 'false'
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const out = evaluateRulesGeneric<Ctx, Act>([mkRule('a')], { scope: 'rag' })
    expect(out.metrics.evaluated).toBe(1)
    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })
})
