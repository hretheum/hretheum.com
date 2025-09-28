// All comments/docstrings in English per policy.
import type {
  CsrRuleAction,
  CsrRuleContext,
  CsrRuleContextInput,
  CsrRuleEvaluation,
  RagRuleAction,
  RagRuleContext,
  RagRuleContextInput,
  RagRuleEvaluation,
  RuleActionBase,
  RuleContextBase,
  RuleDefinition,
  SsrHeroEffect,
  SsrRuleAction,
  SsrRuleContext,
  SsrRuleContextInput,
  SsrRuleEvaluation,
} from './types'
import { evaluateRulesGeneric } from './engine'

// Re-export common helpers
export * from './types'
export * from './predicates'
export * from './actions'

// Strongly typed evaluate wrappers per scope
export function evaluateSsrRules(rules: RuleDefinition<SsrRuleContext, SsrRuleAction>[], ctx: SsrRuleContextInput, debug = false): SsrRuleEvaluation {
  const context: SsrRuleContext = { ...ctx, scope: 'ssr', debug }
  const out = evaluateRulesGeneric<SsrRuleContext, SsrRuleAction>(rules, context, { debug })
  const hero: SsrHeroEffect = {}
  const debugMessages: string[] = []
  for (const r of out.actions) {
    if (r.action.type === 'ssr.hero.update') Object.assign(hero, r.action.payload || {})
    if (r.action.type === 'ssr.debug.log') debugMessages.push(r.action.payload?.message || '')
  }
  return { ...out, effects: { hero, debugMessages } }
}

export function evaluateCsrRules(rules: RuleDefinition<CsrRuleContext, CsrRuleAction>[], ctx: CsrRuleContextInput, debug = false): CsrRuleEvaluation {
  const { debugBrands = [], device = 'unknown', consentGranted = false, ...rest } = (ctx || {}) as CsrRuleContextInput & Partial<Pick<CsrRuleContext, 'debugBrands' | 'device' | 'consentGranted'>>
  const context: CsrRuleContext = { debug, scope: 'csr', debugBrands, device, consentGranted, ...rest }
  const out = evaluateRulesGeneric<CsrRuleContext, CsrRuleAction>(rules, context, { debug })
  const effects: CsrRuleEvaluation['effects'] = { debugTelemetry: false, suppressedEvents: [], tags: [], ui: {} }
  for (const r of out.actions) {
    switch (r.action.type) {
      case 'csr.telemetry.enable_debug':
        effects.debugTelemetry = true
        break
      case 'csr.telemetry.suppress_event':
        effects.suppressedEvents.push(r.action.payload?.event || '')
        break
      case 'csr.tag.append':
        effects.tags.push(r.action.payload?.tag || '')
        break
      case 'csr.ui.tooltip':
        effects.ui.tooltip = { target: r.action.payload?.target || 'primary_cta', message: r.action.payload?.message || '' }
        break
      case 'csr.ui.novice_disclosure':
        effects.ui.noviceDisclosure = !!r.action.payload?.enable
        break
    }
  }
  return { ...out, effects }
}

export function evaluateRagRules(rules: RuleDefinition<RagRuleContext, RagRuleAction>[], ctx: RagRuleContextInput, debug = false): RagRuleEvaluation {
  const context: RagRuleContext = { debug, scope: 'rag', ...ctx }
  const out = evaluateRulesGeneric<RagRuleContext, RagRuleAction>(rules, context, { debug })
  const effects: RagRuleEvaluation['effects'] = { lowConfidence: false, meta: {}, debugMessages: [] }
  for (const r of out.actions) {
    switch (r.action.type) {
      case 'rag.flag.low_confidence':
        effects.lowConfidence = !!r.action.payload?.value
        break
      case 'rag.respond.request_clarification':
        effects.clarification = { message: r.action.payload?.message || '' }
        break
      case 'rag.meta.attach':
        Object.assign(effects.meta, r.action.payload || {})
        break
      case 'rag.debug.log':
        effects.debugMessages.push(r.action.payload?.message || '')
        break
    }
  }
  return { ...out, effects }
}

// --- Simple in-memory RuleRegistry (per scope) ---
let _registry = {
  ssr: [] as RuleDefinition<SsrRuleContext, SsrRuleAction>[],
  csr: [] as RuleDefinition<CsrRuleContext, CsrRuleAction>[],
  rag: [] as RuleDefinition<RagRuleContext, RagRuleAction>[],
}

export function registerRules(scope: 'ssr', rules: RuleDefinition<SsrRuleContext, SsrRuleAction>[]): void
export function registerRules(scope: 'csr', rules: RuleDefinition<CsrRuleContext, CsrRuleAction>[]): void
export function registerRules(scope: 'rag', rules: RuleDefinition<RagRuleContext, RagRuleAction>[]): void
export function registerRules(scope: any, rules: any[]): void {
  if (scope === 'ssr') _registry.ssr = rules as any
  else if (scope === 'csr') _registry.csr = rules as any
  else if (scope === 'rag') _registry.rag = rules as any
}

export function getRules(scope: 'ssr'): RuleDefinition<SsrRuleContext, SsrRuleAction>[]
export function getRules(scope: 'csr'): RuleDefinition<CsrRuleContext, CsrRuleAction>[]
export function getRules(scope: 'rag'): RuleDefinition<RagRuleContext, RagRuleAction>[]
export function getRules(scope: any): any[] {
  if (scope === 'ssr') return _registry.ssr
  if (scope === 'csr') return _registry.csr
  if (scope === 'rag') return _registry.rag
  return []
}

export function resetRulesRegistry() {
  _registry = { ssr: [], csr: [], rag: [] }
}
