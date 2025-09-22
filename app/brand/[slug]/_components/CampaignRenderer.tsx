// Documentation: all comments/docstrings in English per policy.
import React from 'react'
import type { Industry } from '@/lib/industry'
import { compileCampaignForBrand } from '@/lib/campaigns'
import * as CampaignComponents from '@/app/campaign/components'
import { CampaignMeta } from '@/app/campaign/components'

export async function CampaignRenderer({ slug, industry }: { slug: string; industry: Industry }) {
  const compiled = await compileCampaignForBrand(slug, CampaignComponents as any)
  if (!compiled) return null
  const { content, frontmatter } = compiled

  return (
    <div className="px-4 sm:px-6 max-w-5xl mx-auto">
      <CampaignMeta
        role={frontmatter.role}
        location={frontmatter.location}
        contract={frontmatter.contract}
        period={frontmatter.period}
      />
      <div className="prose prose-neutral max-w-none">
        {content}
      </div>
    </div>
  )
}
