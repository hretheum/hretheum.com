// All comments/docstrings in English per policy.
import type {
  CsrRuleAction,
  CsrRuleContext,
  RagRuleAction,
  RagRuleContext,
  RuleDefinition,
  SsrRuleAction,
  SsrRuleContext,
} from '@/lib/rules'
import {
  defineRule,
  gates,
  lowConfidence,
  csrUiTooltip,
  csrUiNoviceDisclosure,
  ragFlagLowConfidence,
  ragRespondRequestClarification,
} from '@/lib/rules'

// --- CSR rules (client) ---
export const csrRules: RuleDefinition<CsrRuleContext, CsrRuleAction>[] = [
  defineRule<CsrRuleContext, CsrRuleAction>({
    id: 'csr.hesitationTooltip',
    description: 'Show a short helper tooltip on primary CTA when hesitation is detected',
    scope: 'csr',
    priority: 90,
    conditions: [gates.rulesEnabledCSR, gates.csrHesitationTooltip],
    actions: [csrUiTooltip('primary_cta', 'Tip: możesz zacząć od krótkiej rozmowy lub obejrzeć Playbook.')],
  }),
  defineRule<CsrRuleContext, CsrRuleAction>({
    id: 'csr.noviceDisclosure',
    description: 'Enable novice progressive disclosure UI hints',
    scope: 'csr',
    priority: 100,
    conditions: [gates.rulesEnabledCSR, gates.csrNoviceDisclosure],
    actions: [csrUiNoviceDisclosure(true)],
  }),
]

// --- RAG rules (server/API) ---
export const ragRules: RuleDefinition<RagRuleContext, RagRuleAction>[] = [
  defineRule<RagRuleContext, RagRuleAction>({
    id: 'rag.lowConfidencePrompt',
    description: 'If confidence below threshold, flag and ask for clarification',
    scope: 'rag',
    priority: 50,
    conditions: [gates.rulesEnabledRAG, gates.ragLowConfidence, lowConfidence],
    actions: [
      ragFlagLowConfidence(true),
      ragRespondRequestClarification('Could you clarify what you need? I can show case studies, competencies, or leadership approach.'),
    ],
  }),
]

// --- SSR rules (server rendering) ---
export const ssrRules: RuleDefinition<SsrRuleContext, SsrRuleAction>[] = [
  // Intentionally empty for now; SSR above-the-fold stays deterministic.
]

export type RulesByScope = {
  ssr: typeof ssrRules
  csr: typeof csrRules
  rag: typeof ragRules
}

export const rules: RulesByScope = {
  ssr: ssrRules,
  csr: csrRules,
  rag: ragRules,
}
