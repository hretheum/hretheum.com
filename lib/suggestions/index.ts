// All comments/documentation in English per project rules.
// Suggestions generator for low-confidence RAG scenarios (T15-1/T15-5).

import type { Industry } from '@/lib/industry'

// Basic, safe, template-based suggestions per industry. No trademarks/logos.
export function getSuggestedQueries(industry: Industry | 'Generic', brandSlug?: string): string[] {
  const b = (brandSlug || '').toLowerCase()
  const brandHint = b ? ` for ${b}` : ''
  const common = [
    `Show competencies overview${brandHint}`,
    `What leadership approach do you use${brandHint}?`,
    `Share a case study relevant to ${industry.toString()}`,
    `What experience is most relevant to ${industry.toString()}?`,
    `How do you measure outcomes in ${industry.toString()}?`,
  ]
  switch (industry) {
    case 'SaaS':
      return [
        `Case studies about product-led growth${brandHint}`,
        `Design system governance in multi-tenant apps`,
        `Signals for trial→paid conversion`,
        ...common.slice(0, 2),
      ]
    case 'Pharma':
      return [
        `Compliance-friendly research process`,
        `Signals tied to GxP contexts`,
        `Privacy and audit trails in design ops`,
        ...common.slice(0, 2),
      ]
    case 'FinTech':
      return [
        `Risk & compliance-aware UX signals`,
        `Reducing fraud while improving UX`,
        `Payments reliability and latency`,
        ...common.slice(0, 2),
      ]
    case 'Commerce':
      return [
        `Customer journey signals (browse→checkout)`,
        `Fulfillment and seasonality readiness`,
        `Merchandising and growth alignment`,
        ...common.slice(0, 2),
      ]
    case 'Retail':
      return [
        `Shopper journey signals across channels`,
        `Cohorts, retention, depth per session`,
        `Drive-to-store campaign readiness`,
        ...common.slice(0, 2),
      ]
    case 'Manufacturing':
      return [
        `Quality & safety signals in operations`,
        `Shift readiness and plant operations`,
        `Digital transformation for OT/IT`,
        ...common.slice(0, 2),
      ]
    case 'Public':
      return [
        `Procurement & transparency constraints`,
        `Security and residency requirements`,
        `Citizen-facing service reliability`,
        ...common.slice(0, 2),
      ]
    case 'Telecom':
      return [
        `Network reliability (5G) and ops`,
        `Reduce churn and improve ARPU`,
        `Edge infrastructure & readiness`,
        ...common.slice(0, 2),
      ]
    case 'DigitalTech':
      return [
        `Design platforms across verticals`,
        `Enterprise discovery→delivery cadence`,
        `AI- and data-informed design ops`,
        ...common.slice(0, 2),
      ]
    case 'eLearning':
      return [
        `Learner outcomes & completion signals`,
        `Assessment integrity & scale`,
        `WCAG and accessibility practices`,
        ...common.slice(0, 2),
      ]
    case 'iGaming':
      return [
        `Player lifecycle signals (acquire→retain)`,
        `Responsible gaming & compliance`,
        `Ops orchestration (product/trading/CS)`,
        ...common.slice(0, 2),
      ]
    case 'Dummy':
      return [
        `Show generic case study`,
        `What competencies are covered?`,
        `Experience highlights by domain`,
        ...common.slice(0, 2),
      ]
    case 'Generic':
    default:
      return [
        `Show a relevant case study${brandHint}`,
        `What are the key competencies${brandHint}?`,
        `Leadership approach overview${brandHint}`,
        ...common.slice(0, 2),
      ]
  }
}
