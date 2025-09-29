// Documentation: all comments/docstrings in English per policy.
// Minimal campaign loader (T32 skeleton):
// - Reads data/campaigns/index.json to locate campaign MDX per brand slug
// - Parses frontmatter via gray-matter
// - Exposes helper to get accent override from frontmatter

import 'server-only'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'

// Force Node.js runtime for file system operations
export const runtime = 'nodejs'

export type CampaignIndexEntry = {
  slug: string
  file?: string
  industry?: string
  role?: string
  accent?: string
  primary_cta_label?: string
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
  skills?: string[]
  requirements?: string
  primary_cta_label?: string
  ctas?: Array<{ label: string; href?: string; variant?: 'primary' | 'secondary' }>
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

export const CAMPAIGNS_DIR = path.join(process.cwd(), 'data', 'campaigns')

export async function getCampaignIndex(): Promise<CampaignIndex> {
  try {
    const indexPath = path.join(CAMPAIGNS_DIR, 'index.json')
    const raw = await fs.readFile(indexPath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function findCampaignForBrand(brandSlug: string): Promise<{ filePath: string; entry: CampaignIndexEntry } | null> {
  const idx = await getCampaignIndex()
  const entry = idx[brandSlug]
  if (!entry) return null
  const file = entry.file || `${entry.slug}.mdx`
  const filePath = path.join(CAMPAIGNS_DIR, file)
  try {
    await fs.access(filePath)
    return { filePath, entry }
  } catch {
    return null
  }
}

export async function loadCampaignFrontmatter(filePath: string): Promise<CampaignFrontmatter | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = matter(raw)
    return (parsed.data || {}) as CampaignFrontmatter
  } catch {
    return null
  }
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

export async function getCampaignAccentForBrand(brandSlug: string): Promise<string | undefined> {
  const found = await findCampaignForBrand(brandSlug)
  if (!found) return undefined
  const fm = await loadCampaignFrontmatter(found.filePath)
  return fm?.accent || undefined
}

export async function hasCampaignForBrand(brandSlug: string): Promise<boolean> {
  const found = await findCampaignForBrand(brandSlug)
  return !!found
}

export async function getCampaignPrimaryCtaLabelForBrand(brandSlug: string): Promise<string | undefined> {
  const found = await findCampaignForBrand(brandSlug)
  if (!found) return undefined
  const fm = await loadCampaignFrontmatter(found.filePath)
  return fm?.primary_cta_label || undefined
}