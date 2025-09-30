/**
 * AI-Powered Campaign Content Generation
 * 
 * Uses LLM + RAG to generate personalized campaign content based on:
 * - Job posting requirements
 * - User's competencies (from vector DB)
 * - User's portfolio/case studies (from vector DB)
 * 
 * @see docs/aui/CAMPAIGN_CREATION_ARCHITECTURE.md - Task 1.4
 */

import { getOpenAIClient } from '@/lib/llm'
import { searchByEmbedding } from '@/lib/rag_store/supabase'
import { OpenAIEmbeddings } from '@langchain/openai'

/**
 * Input for AI generation
 */
export interface AIGenerationInput {
  jobPosting: {
    content: string
    requirements: string[]
    skills: string[]
    role: string
    seniority: string
  }
  brand: string
  industry: string
}

/**
 * Output from AI generation (EXPANDED for rich campaigns)
 */
export interface AIGenerationOutput {
  narrative: {
    positioning: string
    keyMessages: string[]
    tone: 'technical' | 'leadership' | 'strategic'
    confidence: number
  }
  copy: {
    heroHeadline: string
    heroSubtitle?: string
    outcomeBanner?: string
    sections: Array<{
      type: string
      title: string
      subtitle?: string
      bullets?: string[]
      content?: string
    }>
    confidence: number
  }
  caseStudies: Array<{
    id: string
    title: string
    relevanceScore: number
    matchedSkills: string[]
    matchedContext: string
    context?: string
    role?: string
    challenge?: string
    approach?: string[]
    outcome?: string
  }>
  metrics: Array<{
    label: string
    value: string
    source: string
  }>
  experience?: Array<{
    company: string
    period: string
    role: string
    bullets: string[]
  }>
}

/**
 * RAG-retrieved context
 */
interface RAGContext {
  competencies: Array<{
    text: string
    metadata: Record<string, any>
    score: number
  }>
  portfolio: Array<{
    text: string
    metadata: Record<string, any>
    score: number
  }>
}

/**
 * Retrieve relevant competencies and portfolio items from RAG
 * 
 * Phase 3: Uses Supabase with searchByEmbedding() (parseEmbedding handles format)
 */
async function retrieveRAGContext(
  jobRequirements: string[],
  skills: string[]
): Promise<RAGContext> {
  const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
  })
  
  // Build query from requirements and skills
  const query = [...jobRequirements, ...skills].join(' ')
  const queryEmbedding = await embeddings.embedQuery(query)
  
  try {
    // Phase 3: Use Supabase searchByEmbedding() with parseEmbedding() helper
    console.log('[ai-generator] Searching Supabase for relevant context...')
    
    // Search for competencies (relaxed threshold for better recall)
    const competenciesResults = await searchByEmbedding(queryEmbedding, 10, 0.3)
    
    // Search for portfolio/case studies (lower threshold, more results)
    const allResults = await searchByEmbedding(queryEmbedding, 20, 0.2)
    const portfolioResults = allResults
      .filter(r => r.metadata?.source_type === 'case_study' || r.metadata?.source_type === 'experience')
      .slice(0, 15)
    
    console.log(`[ai-generator] Found ${competenciesResults.length} competencies, ${portfolioResults.length} portfolio items`)
    
    return {
      competencies: competenciesResults.map(r => ({
        text: r.text,
        metadata: r.metadata,
        score: r.score,
      })),
      portfolio: portfolioResults.map(r => ({
        text: r.text,
        metadata: r.metadata,
        score: r.score,
      })),
    }
  } catch (error) {
    console.error('[ai-generator] RAG retrieval failed:', error)
    return { competencies: [], portfolio: [] }
  }
}

/**
 * Generate campaign content using LLM
 */
async function generateWithLLM(
  input: AIGenerationInput,
  context: RAGContext
): Promise<AIGenerationOutput> {
  const client = getOpenAIClient()
  
  // Build context for LLM
  const competenciesContext = context.competencies
    .map(c => `- ${c.text} (relevance: ${(c.score * 100).toFixed(0)}%)`)
    .join('\n')
  
  const portfolioContext = context.portfolio
    .map(p => `- ${p.text} (relevance: ${(p.score * 100).toFixed(0)}%)`)
    .join('\n')
  
  const systemPrompt = `You are an expert career strategist creating a rich, detailed campaign page for a job application.

CAMPAIGN STRUCTURE (based on actual successful campaigns):
1. Hero + MetricsStrip (3-4 metrics showing scale/impact)
2. OutcomeBanner (compelling outcome statement)
3. 6-10 Playbook sections (role-specific strategies, organized by themes)
4. Experience timeline (2-4 recent positions)
5. Case studies (2-4 projects matched to job requirements)
6. Standard footer (Leadership, Playbook, AI Builder, Other Projects, Keywords, Closing CTA)

CRITICAL CONSTRAINTS:
- Only reference actual projects from provided portfolio
- No fabricated metrics or outcomes
- Maintain professional, confident tone
- Focus on measurable impact and outcomes
- Generate rich, detailed content for each section (not generic placeholders)
- Return valid JSON only

TONE GUIDELINES:
- Leadership roles: Strategic vision, team outcomes, scalability
- IC/Senior roles: Technical depth, craft excellence, velocity
- Always: Outcome-focused, metrics-driven, confident

Context provided:
1. Job posting requirements (analyze for key themes)
2. Candidate's competencies (from portfolio)
3. Candidate's case studies/projects

Output must be JSON with this EXPANDED structure:
{
  "narrative": {
    "positioning": "One-sentence positioning statement",
    "keyMessages": ["5 key messages emphasizing relevant experience"],
    "tone": "technical|leadership|strategic",
    "confidence": 0.0-1.0
  },
  "copy": {
    "heroHeadline": "Compelling headline (under 100 chars)",
    "heroSubtitle": "Subtitle expanding on headline",
    "outcomeBanner": "Outcome-focused banner message",
    "sections": [
      {
        "type": "playbook",
        "title": "Section title",
        "subtitle": "Section subtitle",
        "bullets": ["4-6 detailed bullet points with specifics"]
      }
    ],
    "confidence": 0.0-1.0
  },
  "metrics": [
    {"label": "Markets/Teams/Projects", "value": "15+", "source": "Which project"}
  ],
  "caseStudies": [
    {
      "id": "project-slug",
      "title": "Project title",
      "relevanceScore": 0.0-1.0,
      "matchedSkills": ["skills from job posting"],
      "matchedContext": "Why this project is relevant",
      "context": "Project background (1-2 sentences)",
      "role": "Your role in the project",
      "challenge": "What problem was solved",
      "approach": ["2-3 approaches taken"],
      "outcome": "Measurable outcome achieved"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "period": "2020-2023",
      "role": "Job title",
      "bullets": ["3-4 key achievements"]
    }
  ]
}`

  const userPrompt = `JOB POSTING DETAILS:
Role: ${input.jobPosting.role}
Seniority: ${input.jobPosting.seniority}
Brand: ${input.brand}
Industry: ${input.industry}

Requirements:
${input.jobPosting.requirements.join('\n')}

Required Skills:
${input.jobPosting.skills.join(', ')}

CANDIDATE'S COMPETENCIES (from actual portfolio):
${competenciesContext || 'None available'}

CANDIDATE'S PROJECTS (actual case studies):
${portfolioContext || 'None available'}

Generate RICH campaign content that:

1. HERO: Compelling headline + subtitle for ${input.industry} ${input.jobPosting.role}
2. METRICS: 3-4 impactful metrics (teams/markets/projects/outcomes) from actual portfolio
3. OUTCOME BANNER: One powerful outcome-focused statement
4. PLAYBOOK SECTIONS (6-10): Role-specific strategies covering:
   - Vision & strategy for the role
   - Team collaboration model (if leadership)
   - Delivery & outcomes framework
   - 30-60-90 day plan
   - Tools & methodologies
   - Success metrics
   - Risk mitigation
   - Stakeholder management
   Each section: title + subtitle + 4-6 detailed, specific bullets
5. EXPERIENCE TIMELINE: 2-4 recent positions with company, period, role, 3-4 key achievements each
6. CASE STUDIES: 2-4 projects from portfolio, ranked by relevance to job requirements
   Each with: title, context, role, challenge, approach (array), measurable outcome
7. KEY MESSAGES: 5 messages emphasizing fit for this specific role

IMPORTANT: 
- Sections should be DETAILED and SPECIFIC, not generic
- Reference actual methodologies, frameworks, tools from job posting
- Metrics must come from actual portfolio (with source)
- Case studies must match job requirements (explain relevance)
- Tone should match seniority level (${input.jobPosting.seniority})`

  try {
    // Create with timeout using AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout for rich content
    
    const response = await client.chat.completions.create({
      model: process.env.AI_MODEL_GENERATION || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    }, {
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from LLM')
    }
    
    const generated = JSON.parse(content) as AIGenerationOutput
    
    // Validate and add confidence scores if missing
    if (!generated.narrative.confidence) {
      generated.narrative.confidence = 0.8 // Default for successful generation
    }
    if (!generated.copy.confidence) {
      generated.copy.confidence = 0.8
    }
    
    console.log('[ai-generator] Successfully generated campaign content', {
      heroHeadline: generated.copy.heroHeadline,
      caseStudiesCount: generated.caseStudies.length,
      sectionsCount: generated.copy.sections.length,
    })
    
    return generated
    
  } catch (error: any) {
    console.error('[ai-generator] LLM generation failed:', error)
    throw new Error(`LLM generation failed: ${error.message}`)
  }
}

/**
 * Generate generic fallback content (when LLM fails)
 */
function generateFallbackContent(input: AIGenerationInput): AIGenerationOutput {
  console.warn('[ai-generator] Using fallback generic content')
  
  return {
    narrative: {
      positioning: `Experienced ${input.jobPosting.role} with expertise in ${input.industry}`,
      keyMessages: [
        'Proven track record in product leadership',
        'Strong technical and strategic background',
        'Focus on measurable outcomes',
      ],
      tone: 'leadership',
      confidence: 0.3, // Low confidence for fallback
    },
    copy: {
      heroHeadline: `${input.industry.toUpperCase()} ${input.jobPosting.role.toUpperCase()} OPPORTUNITY`,
      heroSubtitle: 'Leadership • Impact • Innovation',
      sections: [
        {
          type: 'intro',
          title: 'About This Role',
          content: `Seeking a ${input.jobPosting.seniority} ${input.jobPosting.role} to join ${input.brand}.`,
        },
      ],
      confidence: 0.3,
    },
    caseStudies: [],
    metrics: [],
  }
}

/**
 * Main function: Generate AI-powered campaign content
 * 
 * @param input - Job posting details and context
 * @returns Generated campaign content with confidence scores
 */
export async function generateCampaignContent(
  input: AIGenerationInput
): Promise<AIGenerationOutput> {
  const startTime = Date.now()
  
  try {
    // Step 1: Retrieve relevant context from RAG
    console.log('[ai-generator] Retrieving RAG context...')
    const context = await retrieveRAGContext(
      input.jobPosting.requirements,
      input.jobPosting.skills
    )
    
    console.log('[ai-generator] RAG context retrieved', {
      competencies: context.competencies.length,
      portfolio: context.portfolio.length,
    })
    
    // Step 2: Generate content with LLM
    console.log('[ai-generator] Generating content with LLM...')
    const generated = await generateWithLLM(input, context)
    
    const duration = Date.now() - startTime
    console.log('[ai-generator] Generation complete', {
      duration,
      confidence: {
        narrative: generated.narrative.confidence,
        copy: generated.copy.confidence,
      },
    })
    
    return generated
    
  } catch (error: any) {
    console.error('[ai-generator] Generation failed, using fallback:', error)
    return generateFallbackContent(input)
  }
}

/**
 * Validate generated content quality
 */
export function validateGeneratedContent(output: AIGenerationOutput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check hero headline length
  if (output.copy.heroHeadline.length > 200) {
    errors.push('Hero headline too long (> 200 chars)')
  }
  
  // Check confidence scores
  if (output.narrative.confidence < 0.5) {
    errors.push('Low narrative confidence (< 0.5)')
  }
  
  if (output.copy.confidence < 0.5) {
    errors.push('Low copy confidence (< 0.5)')
  }
  
  // Check case study relevance scores
  const lowRelevanceCases = output.caseStudies.filter(c => c.relevanceScore < 0.6)
  if (lowRelevanceCases.length > 0) {
    errors.push(`${lowRelevanceCases.length} case studies with low relevance (< 0.6)`)
  }
  
  // Check for empty critical fields
  if (!output.copy.heroHeadline) {
    errors.push('Missing hero headline')
  }
  
  if (output.narrative.keyMessages.length === 0) {
    errors.push('No key messages generated')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
