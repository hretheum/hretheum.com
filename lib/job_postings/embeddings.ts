// Job Posting Embedding Generator - Steps 6 & 6b
// Generates embeddings for semantic search (mock + real implementation)

import OpenAI from 'openai'
import type { ExtractedData } from './extractor'

export interface EmbeddingResult {
  full_text: number[]
  requirements: number[]
  skills: number[]
  model: string
  dimensions: number
}

async function generateWithOpenAI(
  content: string,
  extracted: ExtractedData
): Promise<EmbeddingResult> {
  const openai = new OpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.AI_GATEWAY_API_KEY ? process.env.AI_GATEWAY_URL : undefined,
  })

  const model = process.env.AI_MODEL_EMBEDDINGS || 'text-embedding-3-small'

  try {
    // Generate embeddings for three different contexts
    const [fullTextEmb, requirementsEmb, skillsEmb] = await Promise.all([
      // Full text embedding
      openai.embeddings.create({
        model,
        input: content.slice(0, 8000), // ~8k chars limit
      }),
      // Requirements embedding
      openai.embeddings.create({
        model,
        input: extracted.core_requirements.join(', ').slice(0, 8000),
      }),
      // Skills embedding
      openai.embeddings.create({
        model,
        input: [...extracted.technical_skills, ...extracted.soft_skills].join(', ').slice(0, 8000),
      }),
    ])

    console.log(`[embeddings] Generated real embeddings using ${model}`)

    return {
      full_text: fullTextEmb.data[0].embedding,
      requirements: requirementsEmb.data[0].embedding,
      skills: skillsEmb.data[0].embedding,
      model,
      dimensions: fullTextEmb.data[0].embedding.length,
    }
  } catch (error: any) {
    console.error(`[embeddings] Real embedding generation failed: ${error.message}`)
    // Fallback to mock on error
    console.log(`[embeddings] Falling back to mock embeddings`)
    const mockVector = () => Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    return {
      full_text: mockVector(),
      requirements: mockVector(),
      skills: mockVector(),
      model: 'mock-embedding-model-fallback',
      dimensions: 1536,
    }
  }
}

export async function generateEmbeddings(
  content: string,
  extracted: ExtractedData,
  useMock: boolean = false  // Changed default to false (use real embeddings)
): Promise<EmbeddingResult> {
  if (useMock) {
    console.log(`[embeddings] Using MOCK embeddings`)
    
    // Generate random 1536-dimensional vectors (OpenAI text-embedding-3-small size)
    const mockVector = () => Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    
    return {
      full_text: mockVector(),
      requirements: mockVector(),
      skills: mockVector(),
      model: 'mock-embedding-model',
      dimensions: 1536
    }
  }
  
  console.log(`[embeddings] Using REAL OpenAI embeddings`)
  return await generateWithOpenAI(content, extracted)
}
