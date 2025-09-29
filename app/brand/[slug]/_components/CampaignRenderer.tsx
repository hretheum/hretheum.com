// Documentation: all comments/docstrings in English per policy.
// Force Node.js runtime for file system operations
export const runtime = 'nodejs'

import React from 'react'
import type { Industry } from '@/lib/industry'
import { compileMDXDirect } from '@/lib/mdx-compiler'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'
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
import { AIOriginalsSection } from '@/app/campaign/AIOriginalsSection'
import { getIndustryTheme, withOverrides } from '@/lib/theme/industryTheme'

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

async function compileCampaignForBrand(
  brandSlug: string,
  components: Record<string, React.ComponentType<any>>
): Promise<{ content: React.ReactElement; frontmatter: CampaignFrontmatter } | null> {
  const found = await findCampaignForBrand(brandSlug)
  if (!found) return null
  const raw = await fs.readFile(found.filePath, 'utf8')
  // Lazy import MDX compiler to avoid pulling MDX toolchain in non-MDX contexts (e.g., CI frontmatter validation)
  const { compileMDX } = await import('next-mdx-remote/rsc')
  // Normalize ESM namespace object (module with getters) into a plain object for MDX components mapping
  const normalizedComponents: Record<string, any> = { ...(components as any) }
  const compileArgs: any = {
    source: raw,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [],
        rehypePlugins: [],
      },
    },
    components: normalizedComponents,
  }
  if (process.env.NODE_ENV !== 'production') {
    // Ensure MDX compiles with jsxDEV in development to avoid React dev/runtime mismatch
    compileArgs.options = {
      ...compileArgs.options,
      development: true,
      mdxOptions: {
        ...compileArgs.options?.mdxOptions,
        development: true,
      },
    }
    compileArgs.development = true
  }
  const { content, frontmatter } = await compileMDX<CampaignFrontmatter>(compileArgs)
  // Validate frontmatter
  const parsed = ZCampaignFrontmatter.safeParse(frontmatter || {})
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid campaign frontmatter in ${path.relative(ROOT, found.filePath)} → ${msg}`)
  }
  const fm: CampaignFrontmatter = parsed.data as CampaignFrontmatter
  // Hydrate missing CTA hrefs with default Calendly URL
  try {
    if (Array.isArray(fm?.ctas)) {
      fm.ctas = fm.ctas.map((c: any) => ({
        ...c,
        href: c?.href || DEFAULT_CALENDLY,
      }))
    }
  } catch {}
  // Return MDX content as compiled; dev props are handled by compileMDX when development=true
  return { content: content as React.ReactElement, frontmatter: fm }
}

export async function CampaignRenderer({ slug, industry }: { slug: string; industry: Industry }) {
  const components: Record<string, any> = {
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
    AIOriginalsSection,
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
