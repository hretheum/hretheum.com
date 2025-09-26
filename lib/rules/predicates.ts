// All comments/docstrings in English per policy.
import type { CsrRuleContext, RagRuleContext, RuleContextBase, SsrRuleContext } from './types'

/** Utility: read boolean flag from env with default. Works on server and, for NEXT_PUBLIC_* only, on client. */
export function envFlag(name: string, defaultValue = 'false'): boolean {
  const val = (typeof process !== 'undefined' && process.env ? process.env[name] : undefined) ?? defaultValue
  const v = String(val).toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

export function always<C extends RuleContextBase>(_ctx: C): boolean { return true }
export function never<C extends RuleContextBase>(_ctx: C): boolean { return false }

// SSR predicates
export function hasCampaign(ctx: SsrRuleContext): boolean { return !!ctx.hasCampaign }

// CSR predicates
export function consentGranted(ctx: CsrRuleContext): boolean { return !!ctx.consentGranted }
export function isMobile(ctx: CsrRuleContext): boolean { return ctx.device === 'mobile' }
export function brandInDebugList(ctx: CsrRuleContext): boolean {
  const slug = (ctx.brandSlug || '').toLowerCase()
  return ctx.debugBrands?.some((b) => b.toLowerCase() === slug) || false
}

// Placeholder for hesitation detection (to be wired with actual signal)
export function hesitationDetected(_ctx: CsrRuleContext): boolean { return false }

// RAG predicates
export function lowConfidence(ctx: RagRuleContext): boolean { return ctx.confidence < ctx.thresholdLowConfidence }

// Env-based gates (server or client if NEXT_PUBLIC_)
export const gates = {
  rulesEnabledCSR: (ctx: CsrRuleContext) => envFlag('NEXT_PUBLIC_RULES_ENABLED', 'false'),
  rulesEnabledSSR: (_ctx: SsrRuleContext) => envFlag('RULES_ENABLED', 'false'),
  rulesEnabledRAG: (_ctx: RagRuleContext) => envFlag('RULES_ENABLED', 'false'),
  csrHesitationTooltip: (_ctx: CsrRuleContext) => envFlag('NEXT_PUBLIC_RULES_CSR_HESITATION_TOOLTIP', 'false'),
  csrNoviceDisclosure: (_ctx: CsrRuleContext) => envFlag('NEXT_PUBLIC_RULES_CSR_NOVICE_DISCLOSURE', 'false'),
  ragLowConfidence: (_ctx: RagRuleContext) => envFlag('RULES_RAG_LOW_CONFIDENCE', 'true'),
}
