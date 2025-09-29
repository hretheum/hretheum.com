// Job Posting Embedding Generator - Step 6 (Mock)
// Generates embeddings for semantic search (mock implementation for now)

import type { ExtractedData } from './extractor'

export interface EmbeddingResult {
  full_text: number[]
  requirements: number[]
  skills: number[]
  model: string
  dimensions: number
}

export async function generateEmbeddings(
  content: string,
  extracted: ExtractedData,
  useMock: boolean = true
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
  
  // TODO: Step 6b - Real embedding generation
  throw new Error('Real embedding generation not implemented yet')
}
