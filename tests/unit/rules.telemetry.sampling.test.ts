import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { evaluateRulesGeneric } from '@/lib/rules/engine'
import type { RuleDefinition, RuleContextBase, RuleActionBase } from '@/lib/rules/types'

type Ctx = RuleContextBase & { scope: 'rag' }
type Act = RuleActionBase & { type: 't' }

const mkRule = (id: string): RuleDefinition<Ctx, Act> => ({ id, scope: 'rag', conditions: [() => true], actions: [() => ({ type: 't' })] })

const OLD_ENV = { ...process.env }
const OLD_RANDOM = Math.random

describe('rules.eval telemetry sampling', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV }
  })
  afterEach(() => {
    process.env = { ...OLD_ENV }
    // @ts-ignore
    Math.random = OLD_RANDOM
  })

  it('does not emit when sample rate is 0 even if enabled', () => {
    process.env.RULES_TELEMETRY_ENABLED = 'true'
    process.env.RULES_TELEMETRY_SAMPLE_RATE = '0'
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    // @ts-ignore
    Math.random = () => 0.0

    const out = evaluateRulesGeneric<Ctx, Act>([mkRule('a')], { scope: 'rag' })
    expect(out.metrics.evaluated).toBe(1)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('uses default rate=1 when sample rate is NaN', () => {
    process.env.RULES_TELEMETRY_ENABLED = 'true'
    process.env.RULES_TELEMETRY_SAMPLE_RATE = 'foo' // NaN -> default 1
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    // @ts-ignore
    Math.random = () => 0.999

    const out = evaluateRulesGeneric<Ctx, Act>([mkRule('a')], { scope: 'rag' })
    expect(out.metrics.evaluated).toBe(1)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('swallows telemetry exceptions (console.log throws)', () => {
    process.env.RULES_TELEMETRY_ENABLED = 'true'
    process.env.RULES_TELEMETRY_SAMPLE_RATE = '1'
    const spy = vi.spyOn(console, 'log').mockImplementation(() => { throw new Error('nope') })
    // @ts-ignore
    Math.random = () => 0

    const out = evaluateRulesGeneric<Ctx, Act>([mkRule('a')], { scope: 'rag' })
    expect(out.metrics.evaluated).toBe(1)
    // No throw propagated
    spy.mockRestore()
  })
})
