// All comments/docstrings in English per policy.
import type {
  CsrRuleAction,
  CsrRuleContext,
  RagRuleAction,
  RagRuleContext,
  RuleActionFactory,
  SsrHeroEffect,
  SsrRuleAction,
  SsrRuleContext,
} from './types'

// SSR action factories
export function ssrHeroUpdate(payload: Partial<SsrHeroEffect>): RuleActionFactory<SsrRuleContext, SsrRuleAction> {
  return () => ({ type: 'ssr.hero.update', payload })
}
export function ssrDebugLog(message: string): RuleActionFactory<SsrRuleContext, SsrRuleAction> {
  return () => ({ type: 'ssr.debug.log', payload: { message } })
}

// CSR action factories
export function csrTelemetryEnableDebug(reason: string): RuleActionFactory<CsrRuleContext, CsrRuleAction> {
  return () => ({ type: 'csr.telemetry.enable_debug', payload: { reason } })
}
export function csrTelemetrySuppressEvent(event: string): RuleActionFactory<CsrRuleContext, CsrRuleAction> {
  return () => ({ type: 'csr.telemetry.suppress_event', payload: { event } })
}
export function csrTagAppend(tag: string): RuleActionFactory<CsrRuleContext, CsrRuleAction> {
  return () => ({ type: 'csr.tag.append', payload: { tag } })
}
export function csrUiTooltip(target: 'primary_cta' | 'closing_cta' | string, message: string): RuleActionFactory<CsrRuleContext, CsrRuleAction> {
  return () => ({ type: 'csr.ui.tooltip', payload: { target, message } })
}
export function csrUiNoviceDisclosure(enable = true): RuleActionFactory<CsrRuleContext, CsrRuleAction> {
  return () => ({ type: 'csr.ui.novice_disclosure', payload: { enable } })
}

// RAG action factories
export function ragFlagLowConfidence(value: boolean): RuleActionFactory<RagRuleContext, RagRuleAction> {
  return () => ({ type: 'rag.flag.low_confidence', payload: { value } })
}
export function ragRespondRequestClarification(message: string): RuleActionFactory<RagRuleContext, RagRuleAction> {
  return () => ({ type: 'rag.respond.request_clarification', payload: { message } })
}
export function ragMetaAttach(meta: Record<string, unknown>): RuleActionFactory<RagRuleContext, RagRuleAction> {
  return () => ({ type: 'rag.meta.attach', payload: meta })
}
export function ragDebugLog(message: string): RuleActionFactory<RagRuleContext, RagRuleAction> {
  return () => ({ type: 'rag.debug.log', payload: { message } })
}
