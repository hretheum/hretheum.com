import type { Metadata } from 'next'

// Ensure per-request SSR so LLM classification runs at runtime, not at build time
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import RedirectBeacon from './RedirectBeacon'
import { resolveIndustrySSR } from '@/lib/industry_server'
import { IndustryHero } from '../_components/IndustryHero'
import Content from '@/app/components/Content'
import { CampaignRenderer } from './_components/CampaignRenderer'
import RagChat from '@/app/components/RagChatLazy'
// T14 SSR adapter (currently no SSR rules configured; kept for completeness and future use)
import { evaluateSsrRules } from '@/lib/rules'
import { ssrRules } from '@/config/rules'

const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com'

// Campaign helpers - moved here to avoid fs import issues in edge runtime
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'

const ROOT = process.cwd()
const CAMPAIGNS_DIR = path.join(ROOT, 'data', 'campaigns')
const INDEX_FILE = path.join(CAMPAIGNS_DIR, 'index.json')
const DEFAULT_CALENDLY = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/hretheum/short-intro'

type CampaignIndexEntry = {
  slug: string
  file?: string
  industry?: string
  role?: string
  accent?: string
  primary_cta_label?: string
}

type CampaignIndex = Record<string, CampaignIndexEntry>

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

async function findCampaignForBrand(brandSlug: string) {
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

async function loadCampaignFrontmatter(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = matter(raw)
    return (parsed.data || {})
  } catch {
    return null
  }
}

async function getCampaignAccentForBrand(brandSlug: string): Promise<string | undefined> {
  const found = await findCampaignForBrand(brandSlug)
  if (!found) return undefined
  const fm = await loadCampaignFrontmatter(found.filePath)
  return fm?.accent || undefined
}

async function hasCampaignForBrand(brandSlug: string): Promise<boolean> {
  const found = await findCampaignForBrand(brandSlug)
  return !!found
}

async function getCampaignPrimaryCtaLabelForBrand(brandSlug: string): Promise<string | undefined> {
  const found = await findCampaignForBrand(brandSlug)
  if (!found) return undefined
  const fm = await loadCampaignFrontmatter(found.filePath)
  const arr = Array.isArray(fm?.ctas) ? (fm!.ctas as any[]) : []
  if (!arr.length) return undefined
  const primary = arr.find((c) => c?.variant === 'primary') || arr[0]
  return primary?.label || undefined
}

async function getCampaignHeroHeadlineForBrand(brandSlug: string): Promise<string | undefined> {
  const found = await findCampaignForBrand(brandSlug)
  if (!found) return undefined
  const fm = await loadCampaignFrontmatter(found.filePath)
  return (fm?.hero_headline as string | undefined) || undefined
}

export async function generateMetadata(props: { params: Promise<{ slug?: string }> }): Promise<Metadata> {
  const resolvedParams = await props.params
  const slug = resolvedParams?.slug || ''
  const canonical = `https://${APEX_DOMAIN}/brand/${encodeURIComponent(slug)}`
  return {
    title: `Brand – ${slug}`,
    description: `Brand-adaptive landing for ${slug}. Neutral, template-based content without trademarked assets.`,
    alternates: { canonical },
  }
}

export default async function BrandPage(props: { params: Promise<{ slug?: string }> }) {
  const resolvedParams = await props.params
  const slug = resolvedParams?.slug || ''
  const { industry, source, confidence } = await resolveIndustrySSR(slug)
  // Optional: campaign accent override if a campaign exists (T32 skeleton)
  const accent = await getCampaignAccentForBrand(slug)
  const hasCampaign = await hasCampaignForBrand(slug)
  const ctaLabel = await getCampaignPrimaryCtaLabelForBrand(slug)
  const heroHeadline = await getCampaignHeroHeadlineForBrand(slug)

  // T14: SSR rules adapter (apply safe hero effects with full fallbacks)
  let heroProps = {
    accent,
    ctaLabel,
    showCtaOnMobile: !hasCampaign,
    heroHeadline,
  }
  try {
    const ssrEval = evaluateSsrRules(ssrRules, {
      slug,
      industry,
      industrySource: source,
      confidence,
      hasCampaign,
      defaultHeroHeadline: heroHeadline,
      defaultShowCtaOnMobile: !hasCampaign,
      defaultAccent: accent,
    }, false)
    const eff = ssrEval.effects?.hero || {}
    heroProps = {
      accent: eff.accent ?? heroProps.accent,
      ctaLabel: eff.ctaLabel ?? heroProps.ctaLabel,
      showCtaOnMobile: typeof eff.showCtaOnMobile === 'boolean' ? eff.showCtaOnMobile : heroProps.showCtaOnMobile,
      heroHeadline: eff.heroHeadline ?? heroProps.heroHeadline,
    }
  } catch {}

  return (
    <>
      <RedirectBeacon />
      {/* Full-bleed hero like root CoverPage */}
      <IndustryHero
        industry={industry}
        slug={slug}
        source={source}
        confidence={confidence}
        accent={heroProps.accent}
        ctaLabel={heroProps.ctaLabel}
        showCtaOnMobile={heroProps.showCtaOnMobile}
        heroHeadline={heroProps.heroHeadline}
      />
      {/* Always render campaign MDX when present */}
      {hasCampaign ? (
        <CampaignRenderer slug={slug} industry={industry} />
      ) : (
        <Content />
      )}
      {/* AI Chat widget (fixed position) */}
      <RagChat brandSlug={slug} campaignSource={'brand-route'} industry={industry} />
    </>
  )
}