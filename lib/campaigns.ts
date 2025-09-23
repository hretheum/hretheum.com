// Documentation: all comments/docstrings in English per policy.
// Minimal campaign loader (T32 skeleton):
// - Reads data/campaigns/index.json to locate campaign MDX per brand slug
// - Parses frontmatter via gray-matter
// - Exposes helper to get accent override from frontmatter

import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import React from 'react'
import { compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

const ROOT = process.cwd()
const CAMPAIGNS_DIR = path.join(ROOT, 'data', 'campaigns')
const INDEX_FILE = path.join(CAMPAIGNS_DIR, 'index.json')
const DEFAULT_CALENDLY = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/hretheum/short-intro'

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
  role?: string
  location?: string
  contract?: string
  period?: string
  ctas?: Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }>
  sections?: Array<{ type: string }>
  [key: string]: any
}

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

export async function compileCampaignForBrand(
  brandSlug: string,
  components: Record<string, React.ComponentType<any>>
): Promise<{ content: React.ReactElement; frontmatter: CampaignFrontmatter } | null> {
  const found = await findCampaignForBrand(brandSlug)
  if (!found) return null
  const raw = await fs.readFile(found.filePath, 'utf8')
  const { content, frontmatter } = await compileMDX<CampaignFrontmatter>({
    source: raw,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [],
      },
    },
    components,
  })
  // Hydrate missing CTA hrefs with default Calendly URL
  try {
    if (Array.isArray(frontmatter?.ctas)) {
      frontmatter.ctas = frontmatter.ctas.map((c: any) => ({
        ...c,
        href: c?.href || DEFAULT_CALENDLY,
      }))
    }
  } catch {}
  return { content, frontmatter }
}
