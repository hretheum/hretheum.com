// Documentation: all comments/docstrings in English per policy.
import React from 'react'
import type { Industry } from '@/lib/industry'
import { compileCampaignForBrand, serializeCampaignForBrand } from '@/lib/campaigns'
import {
  CTABanner,
  CTAGroup,
  CampaignMeta,
  CaseGrid,
  CaseStudy,
  CaseStudyRich,
  ExperienceItem,
  GalleryMedia,
  MetricsGrid,
  MetricsStrip,
  OutcomeBanner,
  Playbook,
  PlaybookDiagram,
  Quote,
  SectionTitle,
  Timeline,
} from '@/app/campaign/components'
import { getIndustryTheme, withOverrides } from '@/lib/theme/industryTheme'

export async function CampaignRenderer({ slug, industry }: { slug: string; industry: Industry }) {
  const components = {
    CTABanner,
    CTAGroup,
    CampaignMeta,
    CaseGrid,
    CaseStudy,
    CaseStudyRich,
    ExperienceItem,
    GalleryMedia,
    MetricsGrid,
    MetricsStrip,
    OutcomeBanner,
    Playbook,
    PlaybookDiagram,
    Quote,
    SectionTitle,
    Timeline,
  }
  if (process.env.NODE_ENV !== 'production') {
    // Dev path: use client renderer to avoid React 19 dev mismatch
    const ser = await serializeCampaignForBrand(slug)
    if (!ser) return null
    const { compiledSource, frontmatter } = ser
    const base = getIndustryTheme(industry)
    const tokens = withOverrides(base, frontmatter?.accent ? { accent: frontmatter.accent } : undefined)
    const CampaignClient = (await import('./CampaignClient')).default
    return (
      <div className="px-4 sm:px-6 max-w-7xl mx-auto" style={{ ['--campaign-accent' as any]: tokens.accent }}>
        <div className="prose prose-zinc max-w-none prose-headings:scroll-mt-20">
          <CampaignClient compiledSource={compiledSource} />
        </div>
      </div>
    )
  }
  // Production path: SSR via compileMDX
  const compiled = await compileCampaignForBrand(slug, components)
  if (!compiled) return null
  const { content, frontmatter } = compiled
  const base = getIndustryTheme(industry)
  const tokens = withOverrides(base, frontmatter?.accent ? { accent: frontmatter.accent } : undefined)

  return (
    <div className="px-4 sm:px-6 max-w-7xl mx-auto" style={{ ['--campaign-accent' as any]: tokens.accent }}>
      <div className="prose prose-zinc max-w-none prose-headings:scroll-mt-20">
        {content}
      </div>
    </div>
  )
}
