// All comments/documentation in English per project rules.
// Suggestions generator for low-confidence RAG scenarios (T15-1/T15-5).

import type { Industry } from '@/lib/industry'
import { loadCampaignFrontmatter, findCampaignForBrand } from '@/lib/campaigns'

// Campaign-specific suggestions based on role and context
async function getCampaignSpecificSuggestions(brandSlug: string): Promise<string[]> {
  try {
    const campaign = await findCampaignForBrand(brandSlug)
    if (!campaign) return []

    const frontmatter = await loadCampaignFrontmatter(campaign.filePath)
    if (!frontmatter) return []

    const role = frontmatter.role || ''
    const industry = frontmatter.industry || 'Generic'

    // Extract key terms from role description
    const roleLower = role.toLowerCase()

    // Leadership roles
    if (roleLower.includes('lead') || roleLower.includes('leadership') || roleLower.includes('tribe') || roleLower.includes('chapter')) {
      return [
        `Leadership experience in ${industry} organizations`,
        `How do you build and scale design teams?`,
        `Team structure and operating models you've implemented`,
        `Design leadership in distributed/remote teams`,
        `Mentoring and career development approaches`,
        `Stakeholder management and influence strategies`,
      ]
    }

    // Product/UX roles
    if (roleLower.includes('product') || roleLower.includes('ux') || roleLower.includes('ui') || roleLower.includes('designer')) {
      return [
        `Product design process and methodologies`,
        `Design systems and component libraries`,
        `User research and validation approaches`,
        `Cross-functional collaboration patterns`,
        `Measuring design impact on business metrics`,
        `Portfolio of relevant design work`,
      ]
    }

    // Senior/Principal roles
    if (roleLower.includes('senior') || roleLower.includes('principal') || roleLower.includes('head')) {
      return [
        `Senior-level design strategy and vision`,
        `Complex problem-solving in enterprise contexts`,
        `Stakeholder management and influence`,
        `Design operations and process optimization`,
        `Industry expertise and domain knowledge`,
        `Thought leadership and industry contributions`,
      ]
    }

    // Generic role-based suggestions based on keywords
    if (roleLower.includes('manager') || roleLower.includes('director')) {
      return [
        `Management experience and team building`,
        `Process optimization and operational excellence`,
        `Strategic planning and execution`,
        `Cross-functional coordination`,
        `Performance management and development`,
      ]
    }

    // Default suggestions based on industry context
    switch (industry) {
      case 'DigitalTech':
        return [
          `Enterprise UX strategy and execution`,
          `Design systems for complex platforms`,
          `Cross-functional team leadership`,
          `User research at scale`,
          `Design operations and governance`,
        ]
      default:
        return [
          `Experience relevant to ${role}`,
          `Key achievements in similar positions`,
          `Leadership and team management approach`,
          `Industry-specific challenges and solutions`,
          `Process and methodology expertise`,
        ]
    }
  } catch {
    return []
  }
}

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

// Enhanced suggestions that consider campaign-specific context
export async function getEnhancedSuggestedQueries(
  industry: Industry | 'Generic',
  brandSlug?: string
): Promise<string[]> {
  if (!brandSlug) {
    return getSuggestedQueries(industry, brandSlug)
  }

  try {
    // Try to get campaign-specific suggestions first
    const campaignSuggestions = await getCampaignSpecificSuggestions(brandSlug)
    if (campaignSuggestions.length > 0) {
      return campaignSuggestions
    }
  } catch {
    // Fall back to generic suggestions if campaign lookup fails
  }

  // Fall back to industry-based suggestions
  return getSuggestedQueries(industry, brandSlug)
}
