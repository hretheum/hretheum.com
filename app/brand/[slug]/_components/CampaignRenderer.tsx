// Documentation: all comments/docstrings in English per policy.
import React from 'react'
import type { Industry } from '@/lib/industry'
import { compileCampaignForBrand, serializeCampaignForBrand, findCampaignForBrand } from '@/lib/campaigns'
import { compileMDXDirect } from '@/lib/mdx-compiler'
import fs from 'fs/promises'
import {
  CTABanner,
  CTAGroup,
  CampaignMeta,
  CareerTimeline,
  CampaignCapabilityGrid,
  LeadershipSection,
  LeadershipPlaybook,
  CaseGrid,
  CaseStudy,
  CaseStudyRich,
  ExperienceItem,
  GalleryMedia,
  MetricsGrid,
  MetricsStrip,
  PortfolioShowcase,
  OutcomeBanner,
  Playbook,
  PlaybookDiagram,
  Quote,
  SectionTitle,
  Timeline,
  ClosingBanner,
  KeywordsBlock,
} from '@/app/campaign/components'
import { getIndustryTheme, withOverrides } from '@/lib/theme/industryTheme'

export async function CampaignRenderer({ slug, industry }: { slug: string; industry: Industry }) {
  const components = {
    CTABanner,
    CTAGroup,
    CampaignMeta,
    CareerTimeline,
    CampaignCapabilityGrid,
    LeadershipSection,
    LeadershipPlaybook,
    CaseGrid,
    CaseStudy,
    CaseStudyRich,
    ExperienceItem,
    GalleryMedia,
    MetricsGrid,
    MetricsStrip,
    PortfolioShowcase,
    OutcomeBanner,
    Playbook,
    PlaybookDiagram,
    Quote,
    SectionTitle,
    Timeline,
    ClosingBanner,
    KeywordsBlock,
  }
  
  // Use custom MDX compiler in dev to avoid React 19 issues
  if (process.env.NODE_ENV !== 'production') {
    const found = await findCampaignForBrand(slug)
    if (!found) return null
    const raw = await fs.readFile(found.filePath, 'utf8')
    const compiled = await compileMDXDirect(raw, components)
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
  
  // Production path: Use next-mdx-remote (works fine in prod)
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
