// All comments/documentation in English per project rules.
// Deterministic follow-up suggestions based on detected intent and optional industry.

import type { Industry } from '@/lib/industry'

export function getFollowupsForIntent(intentId: string, industry?: Industry | 'Generic'): string[] {
  const ind = (industry || 'Generic') as Industry | 'Generic'
  switch (intentId) {
    case 'retrieval_core.competencies':
      return [
        `Show examples of competencies for ${ind}`,
        'How do you verify skills in practice?'
      ]
    case 'retrieval_core.leadership':
      return [
        `Show a leadership case study in ${ind}`,
        'How do you coach and mentor teams?'
      ]
    case 'retrieval_core.experience':
      return [
        `Show relevant experience highlights for ${ind}`,
        'What outcomes did you deliver?'
      ]
    case 'retrieval_core.case_study':
      return [
        `Show another case study in ${ind}`,
        'What were the key results and trade-offs?'
      ]
    case 'retrieval_core.metrics_experiments':
      return [
        'How do you set success metrics?',
        'How do you run A/B tests safely?'
      ]
    case 'retrieval_core.research_process':
      return [
        'How do you avoid bias in research?',
        `Show a research plan tailored for ${ind}`
      ]
    case 'retrieval_core.design_systems':
      return [
        'Show design tokens and governance approach',
        'How do you scale components across teams?'
      ]
    case 'retrieval_core.tools_automation':
      return [
        'Show automation in design ops',
        'How does Figma/Storybook fit into the workflow?'
      ]
    default:
      return [
        `Show a relevant case study for ${ind}`,
        'Tell me about AUI rules'
      ]
  }
}
