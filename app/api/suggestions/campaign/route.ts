// Force Node.js runtime for file system operations
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

type CampaignIndexEntry = {
  slug: string
  file?: string
  industry?: string
  role?: string
  accent?: string
  primary_cta_label?: string
}

type CampaignIndex = Record<string, CampaignIndexEntry>

type CampaignFrontmatter = {
  slug: string
  industry?: string
  role?: string
  skills?: string[]
  requirements?: string
  accent?: string
  primary_cta_label?: string
  [key: string]: any
}

const CAMPAIGNS_DIR = path.join(process.cwd(), 'data', 'campaigns')

async function getCampaignIndex(): Promise<CampaignIndex> {
  try {
    const indexPath = path.join(CAMPAIGNS_DIR, 'index.json')
    const raw = await fs.readFile(indexPath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
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
    return (parsed.data || {}) as CampaignFrontmatter
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { brandSlug } = await request.json()

    if (!brandSlug) {
      return NextResponse.json({ suggestions: [] })
    }

    const found = await findCampaignForBrand(brandSlug)
    if (!found) {
      return NextResponse.json({ suggestions: [] })
    }

    const fm = await loadCampaignFrontmatter(found.filePath)
    if (!fm) {
      return NextResponse.json({ suggestions: [] })
    }

    // Extract key information from job posting frontmatter
    const role = fm.role || ''
    const industry = fm.industry || ''
    const skills = Array.isArray(fm.skills) ? fm.skills : []
    const requirements = fm.requirements || ''

    // Generate contextual suggestions based on job posting
    const suggestions = []

    if (role) {
      suggestions.push(
        `Experience relevant to ${role}`,
        `Key achievements in similar positions`,
        `Leadership and team management approach`,
        `Industry-specific challenges and solutions`,
        `Process and methodology expertise`,
      )
    }

    if (skills.length > 0) {
      suggestions.push(
        `How have you applied ${skills.slice(0, 2).join(' and ')} in your work?`,
        `Tell me about a project where ${skills[0]} was crucial`,
      )
    }

    if (requirements) {
      suggestions.push(
        `How does your experience align with the requirements?`,
        `What relevant challenges have you overcome?`,
      )
    }

    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error('Campaign suggestions API error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}