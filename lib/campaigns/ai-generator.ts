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
 * Output from AI generation
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
    sections: Array<{
      type: string
      title: string
      content: string
    }>
    confidence: number
  }
  caseStudies: Array<{
    id: string
    title: string
    relevanceScore: number
    matchedSkills: string[]
    matchedContext: string
  }>
  metrics: Array<{
    label: string
    value: string
    source: string
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
    // Search for competencies
    const competenciesResults = await searchByEmbedding(queryEmbedding, 10, 0.6)
    
    // Search for portfolio items (case studies)
    // Note: This assumes portfolio items are also in the chunks table
    // In production, might want separate table or metadata filtering
    const portfolioResults = await searchByEmbedding(queryEmbedding, 15, 0.5)
    
    return {
      competencies: competenciesResults.map(r => ({
        text: r.text,
        metadata: r.metadata,
        score: r.score,
      })),
      portfolio: portfolioResults
        .filter(r => r.metadata?.type === 'case_study' || r.metadata?.type === 'project')
        .map(r => ({
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
  
  const systemPrompt = `You are an expert career strategist helping create a personalized campaign for a job application.

Your task: Generate campaign narrative and copy that positions the candidate's strengths for this specific role.

CRITICAL CONSTRAINTS:
- Only reference actual projects from the provided portfolio
- No fabricated metrics or outcomes
- Maintain professional tone
- Focus on measurable impact
- Return valid JSON only

Context provided:
1. Job posting requirements
2. Candidate's actual competencies (from portfolio)
3. Candidate's actual case studies/projects

Output must be JSON matching this structure:
{
  "narrative": {
    "positioning": "string",
    "keyMessages": ["string"],
    "tone": "technical|leadership|strategic",
    "confidence": number
  },
  "copy": {
    "heroHeadline": "string",
    "heroSubtitle": "string",
    "sections": [{"type": "string", "title": "string", "content": "string"}],
    "confidence": number
  },
  "caseStudies": [{"id": "string", "title": "string", "relevanceScore": number, "matchedSkills": ["string"], "matchedContext": "string"}],
  "metrics": [{"label": "string", "value": "string", "source": "string"}]
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

Generate campaign content that:
1. Creates a compelling hero headline for ${input.industry} ${input.jobPosting.role}
2. Suggests 3-5 key messages emphasizing relevant experience
3. Recommends which case studies to showcase (only from provided projects)
4. Generates copy for campaign sections
5. Extracts factual metrics from actual projects`

  try {
    // Create with timeout using AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
    
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
