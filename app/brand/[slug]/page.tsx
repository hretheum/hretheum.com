import type { Metadata } from 'next'

// Ensure per-request SSR so LLM classification runs at runtime, not at build time
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import RedirectBeacon from './RedirectBeacon'
import { resolveIndustrySSR } from '@/lib/industry_server'
import { IndustryHero } from '../_components/IndustryHero'
import Content from '@/app/components/Content'
import { getCampaignAccentForBrand, hasCampaignForBrand } from '@/lib/campaigns'
import { CampaignRenderer } from './_components/CampaignRenderer'
import RagChat from '@/app/components/RagChat'

const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com'

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const slug = params?.slug || ''
  const canonical = `https://${APEX_DOMAIN}/brand/${encodeURIComponent(slug)}`
  return {
    title: `Brand – ${slug}`,
    description: `Brand-adaptive landing for ${slug}. Neutral, template-based content without trademarked assets.`,
    alternates: { canonical },
  }
}

export default async function BrandPage({ params }: any) {
  const slug = params?.slug || ''
  const { industry, source, confidence } = await resolveIndustrySSR(slug)
  // Optional: campaign accent override if a campaign exists (T32 skeleton)
  const accent = await getCampaignAccentForBrand(slug)
  const hasCampaign = await hasCampaignForBrand(slug)
  return (
    <>
      <RedirectBeacon />
      {/* Full-bleed hero like root CoverPage */}
      <IndustryHero industry={industry} slug={slug} source={source} confidence={confidence} accent={accent} />
      {/* Campaign-first: render campaign MDX when present; otherwise fallback to generic homepage content */}
      {hasCampaign ? (
        <CampaignRenderer slug={slug} industry={industry} />
      ) : (
        <Content />
      )}
      {/* AI Chat widget (fixed position) */}
      <RagChat />
    </>
  )
}
