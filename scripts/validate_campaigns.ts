/*
  Validate all campaign MDX frontmatter using ZCampaignFrontmatter.
  Fails with non-zero exit code if any campaign is invalid.
  All comments/docstrings in English per policy.
*/

import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'

const ROOT = process.cwd()
const CAMPAIGNS_DIR = path.join(ROOT, 'data', 'campaigns')
const INDEX_FILE = path.join(CAMPAIGNS_DIR, 'index.json')

type CampaignIndexEntry = {
  slug: string
  file?: string // optional direct file path (relative to data/campaigns)
}

type CampaignIndex = Record<string, CampaignIndexEntry>

type CampaignFrontmatter = {
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
const ZCampaignFrontmatter = z.object({
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

async function getCampaignIndex(): Promise<CampaignIndex> {
  const data = await readJson<CampaignIndex>(INDEX_FILE)
  return data || {}
}

async function findCampaignForBrand(brandSlug: string): Promise<{ filePath: string; entry: CampaignIndexEntry } | null> {
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

async function loadCampaignFrontmatter(filePath: string): Promise<CampaignFrontmatter | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = matter(raw)
    return (parsed.data as CampaignFrontmatter) || {}
  } catch {
    return null
  }
}

async function validateCampaignFrontmatterForBrand(brandSlug: string): Promise<CampaignFrontmatter> {
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

async function main() {
  const errors: string[] = []
  const idx = await getCampaignIndex()
  const brands = Object.keys(idx)
  if (brands.length === 0) {
    console.log('[validate_campaigns] No campaigns found in index. OK')
    process.exit(0)
  }
  for (const brand of brands) {
    try {
      await validateCampaignFrontmatterForBrand(brand)
      console.log(`[validate_campaigns] ${brand}: OK`)
    } catch (e: any) {
      errors.push(`[${brand}] ${e?.message || e}`)
    }
  }
  if (errors.length > 0) {
    console.error('[validate_campaigns] Validation FAILED:')
    for (const err of errors) console.error(' -', err)
    process.exit(1)
  }
  console.log(`[validate_campaigns] All ${brands.length} campaign(s) valid.`)
}

main().catch((e) => {
  console.error('[validate_campaigns] Fatal error:', e)
  process.exit(1)
})
