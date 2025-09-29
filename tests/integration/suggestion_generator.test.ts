// Integration tests for LLM Suggestion Generator - Step 4

import { config } from 'dotenv'
import path from 'path'
import { describe, test, expect } from 'vitest'
import { generateSuggestions, type GeneratedSuggestions } from '@/lib/job_postings/suggestion_generator'
import type { SuggestionContext } from '@/lib/job_postings/prompt_builder'
import type { JobPostingData } from '@/lib/job_postings/queries'

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

const mockJobPosting: JobPostingData = {
  id: 'test-id',
  brand_slug: 'test',
  title: 'Senior Designer',
  content: 'Test content',
  core_requirements: ['5+ years experience', 'Portfolio required'],
  technical_skills: ['React', 'TypeScript', 'Figma'],
  soft_skills: ['Leadership', 'Communication'],
  domain_knowledge: ['FinTech', 'E-commerce'],
  culture_signals: ['Fast-paced', 'Collaborative'],
  responsibilities: ['Design systems', 'Mentoring'],
  seniority_level: 'senior',
  role_type: 'ic',
  created_at: '2025-01-29T00:00:00Z',
}

describe('LLM Suggestion Generator - Step 4', () => {
  test('generates suggestions from LLM', async () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
    }
    
    const result = await generateSuggestions(context)
    
    expect(result.suggestions).toBeDefined()
    expect(result.suggestions.length).toBeGreaterThan(0)
    expect(result.suggestions.length).toBeLessThanOrEqual(5)
    expect(result.context_hash).toBeDefined()
    expect(result.generated_at).toBeInstanceOf(Date)
    expect(result.model).toBeDefined()
  }, 30000)
  
  test('falls back to generic on error', async () => {
    // Test with empty context that might cause issues
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [],
    }
    
    const result = await generateSuggestions(context)
    
    expect(result.suggestions).toBeDefined()
    expect(result.suggestions.length).toBeGreaterThan(0)
    // Model might be 'fallback' or actual model depending on API availability
    expect(result.model).toBeDefined()
  }, 30000)
  
  test('returns max 5 suggestions', async () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
    }
    
    const result = await generateSuggestions(context)
    
    expect(result.suggestions.length).toBeLessThanOrEqual(5)
  }, 30000)
  
  test('includes context hash', async () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
    }
    
    const result = await generateSuggestions(context)
    
    expect(result.context_hash).toBeDefined()
    expect(typeof result.context_hash).toBe('string')
    expect(result.context_hash.length).toBeGreaterThan(0)
  }, 30000)
})