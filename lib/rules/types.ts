import type { Industry } from '@/lib/industry'
import type { IndustrySource } from '@/lib/industry_server'

/**
 * Base definitions shared by all Adaptive Rules scopes.
 */
export type RuleScope = 'ssr' | 'csr' | 'rag'

export interface RuleContextBase {
  scope: RuleScope
  debug?: boolean
  evaluationId?: string
}

export type RuleCondition<C extends RuleContextBase> = (context: C) => boolean

export interface RuleActionBase {
  type: string
  payload?: Record<string, unknown>
}

export type RuleActionFactory<C extends RuleContextBase, A extends RuleActionBase> = (
  context: C,
) => A | null | undefined

export interface RuleDefinition<C extends RuleContextBase, A extends RuleActionBase> {
  id: string
  description?: string
  scope: RuleScope
  /** Lower number → evaluated earlier. Defaults to 100. */
  priority?: number
  /**
   * When true, prevents running the rule more than once per evaluation. Useful for
   * rules that emit side effects through `onAction` callbacks.
   */
  once?: boolean
  conditions: RuleCondition<C>[]
  actions: RuleActionFactory<C, A>[]
}

export interface RuleActionResult<A extends RuleActionBase> {
  ruleId: string
  scope: RuleScope
  action: A
}

export interface RuleEvaluationMetrics {
  evaluated: number
  matched: number
  actions: number
  durationMs: number
}

export interface RuleEvaluationOutcome<A extends RuleActionBase> {
  actions: RuleActionResult<A>[]
  metrics: RuleEvaluationMetrics
  debugLog?: string[]
}

export interface EvaluateOptions<C extends RuleContextBase, A extends RuleActionBase> {
  maxActions?: number
  debug?: boolean
  onAction?: (result: RuleActionResult<A>, context: C) => void
  now?: () => number
}

/**
 * SSR scope
 */
export interface SsrRuleContext extends RuleContextBase {
  scope: 'ssr'
  slug: string
  industry: Industry
  industrySource?: IndustrySource
  confidence?: number
  hasCampaign: boolean
  defaultHeroHeadline?: string | null
  defaultShowCtaOnMobile: boolean
  defaultAccent?: string | null
}

export interface SsrHeroEffect {
  showCtaOnMobile?: boolean
  heroHeadline?: string
  accent?: string | null
  ctaLabel?: string
}

export type SsrRuleAction =
  | { type: 'ssr.hero.update'; payload: Partial<SsrHeroEffect> }
  | { type: 'ssr.debug.log'; payload: { message: string } }

export interface SsrRuleEvaluation extends RuleEvaluationOutcome<SsrRuleAction> {
  effects: {
    hero: SsrHeroEffect
    debugMessages: string[]
  }
}

export type SsrRuleContextInput = Omit<SsrRuleContext, 'scope'>

/**
 * CSR scope
 */
export interface CsrRuleContext extends RuleContextBase {
  scope: 'csr'
  brandSlug?: string
  route?: string
  consentGranted: boolean
  device: 'desktop' | 'mobile' | 'unknown'
  debugBrands: string[]
}

export type CsrRuleAction =
  | { type: 'csr.telemetry.enable_debug'; payload: { reason: string } }
  | { type: 'csr.telemetry.suppress_event'; payload: { event: string } }
  | { type: 'csr.tag.append'; payload: { tag: string } }

export interface CsrRuleEvaluation extends RuleEvaluationOutcome<CsrRuleAction> {
  effects: {
    debugTelemetry: boolean
    suppressedEvents: string[]
    tags: string[]
  }
}

export type CsrRuleContextInput = Omit<CsrRuleContext, 'scope'>

/**
 * RAG scope
 */
export interface RagRuleContext extends RuleContextBase {
  scope: 'rag'
  intentId: string
  confidence: number
  messagePreview: string
  brandSlug?: string | null
  campaignSource?: string | null
  campaignType?: string | null
  thresholdLowConfidence: number
}

export type RagRuleAction =
  | { type: 'rag.flag.low_confidence'; payload: { value: boolean } }
  | { type: 'rag.respond.request_clarification'; payload: { message: string } }
  | { type: 'rag.meta.attach'; payload: Record<string, unknown> }
  | { type: 'rag.debug.log'; payload: { message: string } }

export interface RagRuleEvaluation extends RuleEvaluationOutcome<RagRuleAction> {
  effects: {
    lowConfidence: boolean
    clarification?: { message: string }
    meta: Record<string, unknown>
    debugMessages: string[]
  }
}

export type RagRuleContextInput = Omit<RagRuleContext, 'scope'>

/** Utility helper to create strongly typed rule definitions. */
export function defineRule<C extends RuleContextBase, A extends RuleActionBase>(
  rule: RuleDefinition<C, A>,
): RuleDefinition<C, A> {
  return rule
}
