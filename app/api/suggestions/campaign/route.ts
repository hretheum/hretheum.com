// Force Node.js runtime for file system operations
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getJobPostingsForBrand, hasJobPostings } from '@/lib/job_postings/queries'
import { matchUserProfile, matchUserProfileSemantic } from '@/lib/job_postings/profile_matcher'
import { generateSuggestions } from '@/lib/job_postings/suggestion_generator'
import { getCachedSuggestions, setCachedSuggestions } from '@/lib/job_postings/suggestion_cache'
import { hashContext } from '@/lib/job_postings/prompt_builder'

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

function getGenericSuggestions(brandSlug: string, industry?: string, role?: string): string[] {
  // Portfolio-focused questions (not interview questions)
  // These should showcase relevant work, not ask generic interview questions
  const suggestions = []
  
  if (industry && role) {
    // Industry + role specific
    suggestions.push(
      `Show me ${industry} projects similar to ${brandSlug}'s work`,
      `How does your ${role} experience apply to ${industry}?`,
      `What's your most relevant case study for ${brandSlug}?`,
    )
  } else if (industry) {
    // Industry-specific
    suggestions.push(
      `Show me your ${industry} portfolio and case studies`,
      `What's your experience in the ${industry} industry?`,
      `How do you approach challenges in ${industry}?`,
    )
  } else if (role) {
    // Role-specific
    suggestions.push(
      `Show me your work as a ${role}`,
      `What's your approach to ${role} challenges?`,
      `Tell me about your ${role} leadership experience`,
    )
  }
  
  // Always add brand-agnostic portfolio questions
  suggestions.push(
    `What's your most impactful product leadership project?`,
    `Show me case studies relevant to ${brandSlug}`,
  )
  
  return suggestions.slice(0, 5)
}

export async function POST(request: NextRequest) {
  try {
    const { brandSlug } = await request.json()

    if (!brandSlug) {
      return NextResponse.json({ suggestions: [], source: 'empty' })
    }

    console.log(`[api/suggestions] Request for brand: ${brandSlug}`)

    // Check if brand has job postings (Step 6 - NEW)
    const hasPostings = await hasJobPostings(brandSlug)
    
    if (hasPostings) {
      console.log(`[api/suggestions] Brand has job postings, using personalized suggestions`)
      
      // Fetch job postings
      const jobPostings = await getJobPostingsForBrand(brandSlug, 5)
      
      if (jobPostings.length > 0) {
        // Match user profile with job posting (Step 3)
        // Phase 5: Use semantic matching if enabled, fallback to string matching
        const useSemanticMatching = process.env.ENABLE_SEMANTIC_MATCHING === 'true'
        const profileMatch = useSemanticMatching 
          ? await matchUserProfileSemantic(jobPostings[0])
          : await matchUserProfile(jobPostings[0])
        
        // Build context with personalization
        const context = {
          brand_slug: brandSlug,
          job_postings: jobPostings,
          user_profile_match: profileMatch,
        }
        
        // Check cache first (Step 5)
        const contextHash = hashContext(context)
        const cached = await getCachedSuggestions(brandSlug, contextHash)
        
        if (cached) {
          console.log(`[api/suggestions] Returning cached suggestions`)
          return NextResponse.json({
            suggestions: cached.suggestions,
            source: 'cache',
            generated_at: cached.generated_at,
            cache_hit: true,
          })
        }
        
        // Generate new suggestions (Step 4)
        console.log(`[api/suggestions] Generating new personalized suggestions`)
        const generated = await generateSuggestions(context)
        
        // Cache for future use (Step 5)
        await setCachedSuggestions(brandSlug, generated, 24)
        
        return NextResponse.json({
          suggestions: generated.suggestions,
          source: 'generated',
          generated_at: generated.generated_at,
          cache_hit: false,
          personalized: true,
        })
      }
    }
    
    // Fallback to campaign-based suggestions
    console.log(`[api/suggestions] No job postings, using campaign-based suggestions`)
    
    const found = await findCampaignForBrand(brandSlug)
    if (!found) {
      return NextResponse.json({ 
        suggestions: getGenericSuggestions(brandSlug),
        source: 'generic',
      })
    }

    const fm = await loadCampaignFrontmatter(found.filePath)
    if (!fm) {
      return NextResponse.json({ 
        suggestions: getGenericSuggestions(brandSlug),
        source: 'generic',
      })
    }

    const suggestions = getGenericSuggestions(brandSlug, fm.industry, fm.role)
    
    return NextResponse.json({ 
      suggestions,
      source: 'campaign',
    })

  } catch (error) {
    console.error('[api/suggestions] Error:', error)
    return NextResponse.json({ 
      suggestions: [],
      source: 'error',
    })
  }
}