import type { Metadata } from 'next'

// Ensure per-request SSR so LLM classification runs at runtime, not at build time
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import RedirectBeacon from './RedirectBeacon'
import { resolveIndustrySSR } from '@/lib/industry_server'
import { IndustryHero } from '../_components/IndustryHero'
import Content from '@/app/components/Content'
import { getCampaignAccentForBrand, hasCampaignForBrand, getCampaignPrimaryCtaLabelForBrand, getCampaignHeroHeadlineForBrand } from '@/lib/campaigns'
import { CampaignRenderer } from './_components/CampaignRenderer'
import RagChat from '@/app/components/RagChat'
// T14 SSR adapter (currently no SSR rules configured; kept for completeness and future use)
import { evaluateSsrRules } from '@/lib/rules'
import { ssrRules } from '@/config/rules'

const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com'

export async function generateMetadata(props: { params: Promise<{ slug?: string }> }): Promise<Metadata> {
  const resolvedParams = await props.params
  const slug = resolvedParams?.slug || ''
  const canonical = `https://${APEX_DOMAIN}/brand/${encodeURIComponent(slug)}`
  return {
    title: `Brand – ${slug}`,
    description: `Brand-adaptive landing for ${slug}. Neutral, template-based content without trademarked assets.`,
    alternates: { canonical },
  }
}

export default async function BrandPage(props: { params: Promise<{ slug?: string }> }) {
  const resolvedParams = await props.params
  const slug = resolvedParams?.slug || ''
  const { industry, source, confidence } = await resolveIndustrySSR(slug)
  // Optional: campaign accent override if a campaign exists (T32 skeleton)
  const accent = await getCampaignAccentForBrand(slug)
  const hasCampaign = await hasCampaignForBrand(slug)
  const ctaLabel = await getCampaignPrimaryCtaLabelForBrand(slug)
  const heroHeadline = await getCampaignHeroHeadlineForBrand(slug)

  // T14: SSR rules adapter (effects currently unused; kept for future SSR tuning)
  try {
    const ssrEval = evaluateSsrRules(ssrRules, {
      slug,
      industry,
      industrySource: source,
      confidence,
      hasCampaign,
      defaultHeroHeadline: heroHeadline,
      defaultShowCtaOnMobile: !hasCampaign,
      defaultAccent: accent,
    }, false)
    // Placeholder: could apply ssrEval.effects.hero later if SSR rules are added
    void ssrEval
  } catch {}

  return (
    <>
      <RedirectBeacon />
      {/* Full-bleed hero like root CoverPage */}
      <IndustryHero
        industry={industry}
        slug={slug}
        source={source}
        confidence={confidence}
        accent={accent}
        ctaLabel={ctaLabel}
        showCtaOnMobile={!hasCampaign}
        heroHeadline={heroHeadline}
      />
      {/* Always render campaign MDX when present */}
      {hasCampaign ? (
        <CampaignRenderer slug={slug} industry={industry} />
      ) : (
        <Content />
      )}
      {/* AI Chat widget (fixed position) */}
      <RagChat brandSlug={slug} campaignSource={'brand-route'} />
    </>
  )
}
