// Documentation: all comments/docstrings in English per policy.
import React from 'react'
import type { Industry } from '@/lib/industry'
import { compileCampaignForBrand } from '@/lib/campaigns'
import * as CampaignComponents from '@/app/campaign/components'
import { CampaignThemeProvider } from '@/app/campaign/theme'
import { getIndustryTheme, withOverrides } from '@/lib/theme/industryTheme'

export async function CampaignRenderer({ slug, industry }: { slug: string; industry: Industry }) {
  const compiled = await compileCampaignForBrand(slug, CampaignComponents as any)
  if (!compiled) return null
  const { content, frontmatter } = compiled
  const base = getIndustryTheme(industry)
  const tokens = withOverrides(base, frontmatter?.accent ? { accent: frontmatter.accent } : undefined)

  return (
    <CampaignThemeProvider tokens={tokens}>
      <div className="px-4 sm:px-6 max-w-5xl mx-auto" style={{ ['--campaign-accent' as any]: tokens.accent }}>
        <div className="prose prose-zinc max-w-none prose-headings:scroll-mt-20">
          {content}
        </div>
        <style jsx>{`
          .prose :where(h2,h3,h4){ color: var(--campaign-accent); }
          .prose :where(a){ color: var(--campaign-accent); text-decoration-color: var(--campaign-accent); }
          .prose :where(blockquote){ border-left-color: var(--campaign-accent); }
        `}</style>
      </div>
    </CampaignThemeProvider>
  )
}
