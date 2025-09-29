// Documentation: all comments/docstrings in English per policy.
// Minimal campaign loader (T32 skeleton):
// - Reads data/campaigns/index.json to locate campaign MDX per brand slug
// - Parses frontmatter via gray-matter
// - Exposes helper to get accent override from frontmatter

import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'

const ROOT = process.cwd()
const CAMPAIGNS_DIR = path.join(ROOT, 'data', 'campaigns')
const INDEX_FILE = path.join(CAMPAIGNS_DIR, 'index.json')

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

async function readJson<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const buf = await fs.readFile(filePath, 'utf8')
    return JSON.parse(buf) as T
  } catch {
    return null
  }
}

export async function getCampaignIndex(): Promise<CampaignIndex> {
  const data = await readJson<CampaignIndex>(INDEX_FILE)
  return data || {}
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
    return (parsed.data as CampaignFrontmatter) || {}
  } catch {
    return null
  }
}

export async function validateCampaignFrontmatterForBrand(brandSlug: string): Promise<CampaignFrontmatter> {
  const found = await findCampaignForBrand(brandSlug)
  if (!found) throw new Error(`Campaign for brand '${brandSlug}' not found in index`)
  const fm = await loadCampaignFrontmatter(found.filePath)
  const parsed = ZCampaignFrontmatter.safeParse(fm || {})
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid campaign frontmatter in ${path.relative(ROOT, found.filePath)} → ${msg}`)
  }
  return parsed.data as CampaignFrontmatter
}

// Functions for components with Node.js runtime - throw errors to indicate they moved
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