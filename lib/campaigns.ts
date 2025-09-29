// Documentation: all comments/docstrings in English per policy.
// Minimal campaign loader (T32 skeleton):
// - Reads data/campaigns/index.json to locate campaign MDX per brand slug
// - Parses frontmatter via gray-matter
// - Exposes helper to get accent override from frontmatter

// NOTE: All file system operations moved to components with Node.js runtime
// This file now contains only types and schemas for campaign data

import { z } from 'zod'

export type CampaignIndexEntry = {
  slug: string
  file?: string // optional direct file path (relative to data/campaigns)
}

export type CampaignIndex = Record<string, CampaignIndexEntry>

export type CampaignFrontmatter = {
  slug?: string
  brand?: string
  industry?: string
  accent?: string
  ctaVariant?: 'filled' | 'outline'
  role?: string
  location?: string
  contract?: string
  period?: string
  hero_headline?: string
  ctas?: Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }>
  sections?: Array<{ type: string }>
  metrics?: Array<{ label: string; value: string; note?: string }>
  case_grid?: {
    items: Array<{
      title: string
      subtitle?: string
      challenge?: string
      solution?: string
      outcome?: string
      details?: string
    }>
  }
  [key: string]: any
}

// Zod schema for frontmatter (T38)
export const ZCampaignFrontmatter = z.object({
  slug: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  accent: z.string().min(1).optional(),
  ctaVariant: z.enum(['filled', 'outline']).optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  contract: z.string().optional(),
  period: z.string().optional(),
  hero_headline: z.string().min(1).optional(),
  ctas: z
    .array(
      z.object({
        label: z.string().min(1),
        href: z.string().url().optional(),
        variant: z.enum(['primary', 'secondary']).optional(),
      })
    )
    .optional(),
  sections: z.array(z.object({ type: z.string().min(1) })).optional(),
  metrics: z.array(z.object({ label: z.string().min(1), value: z.string().min(1), note: z.string().optional() })).optional(),
  case_grid: z
    .object({
      items: z.array(
        z.object({
          title: z.string().min(1),
          subtitle: z.string().optional(),
          challenge: z.string().optional(),
          solution: z.string().optional(),
          outcome: z.string().optional(),
          details: z.string().optional(),
        })
      ),
    })
    .optional(),
})

// Functions for components with Node.js runtime - throw errors to indicate they moved
export async function getCampaignIndex(): Promise<CampaignIndex> {
  throw new Error('getCampaignIndex moved to components - use the component version')
}

export async function findCampaignForBrand(brandSlug: string): Promise<{ filePath: string; entry: CampaignIndexEntry } | null> {
  throw new Error('findCampaignForBrand moved to components - use the component version')
}

export async function loadCampaignFrontmatter(filePath: string): Promise<CampaignFrontmatter | null> {
  throw new Error('loadCampaignFrontmatter moved to components - use the component version')
}

export async function validateCampaignFrontmatterForBrand(brandSlug: string): Promise<CampaignFrontmatter> {
  throw new Error('validateCampaignFrontmatterForBrand moved to components - use the component version')
}

export async function getCampaignAccentForBrand(brandSlug: string): Promise<string | undefined> {
  throw new Error('getCampaignAccentForBrand moved to page.tsx - use the component version')
}

export async function hasCampaignForBrand(brandSlug: string): Promise<boolean> {
  throw new Error('hasCampaignForBrand moved to page.tsx - use the component version')
}

export async function getCampaignPrimaryCtaLabelForBrand(brandSlug: string): Promise<string | undefined> {
  throw new Error('getCampaignPrimaryCtaLabelForBrand moved to page.tsx - use the component version')
}

export async function getCampaignHeroHeadlineForBrand(brandSlug: string): Promise<string | undefined> {
  throw new Error('getCampaignHeroHeadlineForBrand moved to page.tsx - use the component version')
}

export async function compileCampaignForBrand(
  brandSlug: string,
  components: Record<string, React.ComponentType<any>>
): Promise<{ content: React.ReactElement; frontmatter: CampaignFrontmatter } | null> {
  throw new Error('compileCampaignForBrand moved to CampaignRenderer.tsx - use the component version')
}

export async function serializeCampaignForBrand(
  brandSlug: string
): Promise<{ compiledSource: string; frontmatter: CampaignFrontmatter } | null> {
  throw new Error('serializeCampaignForBrand moved to CampaignRenderer.tsx - use the component version')
}