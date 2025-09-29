// Integration tests for Cache Invalidation - Step 7

import { config } from 'dotenv'
import path from 'path'
import { describe, test, expect } from 'vitest'
import { setCachedSuggestions, getCachedSuggestions } from '@/lib/job_postings/suggestion_cache'
import { storeJobPosting } from '@/lib/job_postings/storage'
import type { GeneratedSuggestions } from '@/lib/job_postings/suggestion_generator'
import type { FileMetadata } from '@/lib/job_postings/metadata'
import type { NormalizedContent } from '@/lib/job_postings/normalizer'
import type { ExtractedData } from '@/lib/job_postings/extractor'
import type { EmbeddingResult } from '@/lib/job_postings/embeddings'

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

const mockSuggestions: GeneratedSuggestions = {
  suggestions: ['Q1', 'Q2', 'Q3'],
  context_hash: 'test-hash-invalidation',
  generated_at: new Date(),
  model: 'gpt-4o-mini',
}

const mockMetadata: FileMetadata = {
  brand_slug: 'invalidation-test',
  timestamp: new Date(),
  format: 'md',
  valid: true,
}

const mockNormalized: NormalizedContent = {
  normalized: 'Test content for invalidation',
  stats: {
    originalLength: 100,
    normalizedLength: 100,
    linesRemoved: 0,
    whitespaceReduced: 0,
  },
  lineBreaks: 'unix',
}

const mockExtracted: ExtractedData = {
  core_requirements: ['Test requirement'],
  technical_skills: ['React'],
  soft_skills: ['Communication'],
  domain_knowledge: ['Tech'],
  culture_signals: ['Agile'],
  responsibilities: ['Development'],
  seniority_level: 'mid',
  role_type: 'ic',
}

const mockEmbeddings: EmbeddingResult = {
  full_text: new Array(1536).fill(0.1),
  requirements: new Array(1536).fill(0.1),
  skills: new Array(1536).fill(0.1),
  dimensions: 1536,
  model: 'mock',
}

describe('Cache Invalidation - Step 7', () => {
  test('invalidates suggestion cache on new job posting', async () => {
    const testBrand = `invalidation-test-${Date.now()}`
    const testMetadata = { ...mockMetadata, brand_slug: testBrand }
    
    // Cache some suggestions
    await setCachedSuggestions(testBrand, mockSuggestions, 24)
    
    // Verify cached
    let cached = await getCachedSuggestions(testBrand, 'test-hash-invalidation')
    expect(cached).toBeDefined()
    expect(cached?.suggestions).toEqual(['Q1', 'Q2', 'Q3'])
    
    // Store new job posting (should invalidate cache)
    const result = await storeJobPosting(testMetadata, mockNormalized, mockExtracted, mockEmbeddings)
    expect(result.success).toBe(true)
    
    // Verify cache cleared
    cached = await getCachedSuggestions(testBrand, 'test-hash-invalidation')
    expect(cached).toBeNull()
  }, 30000)
})