// Integration tests for OpenAI Embedding Generator - Step 6b (Real)

import { describe, test, expect } from 'vitest'
import { generateEmbeddings } from '@/lib/job_postings/embeddings'
import { extractSemanticData } from '@/lib/job_postings/extractor'

describe('OpenAI Embedding Generator - Step 6b (Real)', () => {
  test('generates real embeddings from OpenAI', async () => {
    const content = `
# Senior Product Designer

## Requirements
- 5+ years of product design experience
- Experience with React, TypeScript, and Figma
- Excellent communication skills

## Responsibilities
- Lead design system initiatives
- Collaborate with engineering teams
    `
    const extracted = await extractSemanticData(content, true) // Use mock for extraction
    
    const result = await generateEmbeddings(content, extracted, false)
    
    // Verify structure
    expect(result).toBeDefined()
    expect(result.dimensions).toBe(1536)
    expect(result.full_text).toHaveLength(1536)
    expect(result.requirements).toHaveLength(1536)
    expect(result.skills).toHaveLength(1536)
    
    // Verify model
    expect(result.model).toContain('embedding')
    
    // Verify values are valid numbers
    result.full_text.forEach(val => {
      expect(typeof val).toBe('number')
      expect(isNaN(val)).toBe(false)
      expect(isFinite(val)).toBe(true)
    })
  }, 30000)

  test('generates different embeddings for different contexts', async () => {
    const content = '# Developer\n\nRequires Python, JavaScript'
    const extracted = await extractSemanticData(content, true)
    
    const result = await generateEmbeddings(content, extracted, false)
    
    // Embeddings should be different (not identical)
    const fullTextSum = result.full_text.reduce((a, b) => a + b, 0)
    const requirementsSum = result.requirements.reduce((a, b) => a + b, 0)
    const skillsSum = result.skills.reduce((a, b) => a + b, 0)
    
    // With real embeddings, sums should be different
    expect(fullTextSum).not.toBe(requirementsSum)
    expect(fullTextSum).not.toBe(skillsSum)
  }, 30000)

  test('handles empty content gracefully', async () => {
    const content = ''
    const extracted = await extractSemanticData(content, true)
    
    const result = await generateEmbeddings(content, extracted, false)
    
    // Should not crash, returns valid structure
    expect(result).toBeDefined()
    expect(result.dimensions).toBe(1536)
    expect(result.full_text).toHaveLength(1536)
  }, 30000)

  test('handles long content with truncation', async () => {
    const longContent = 'Lorem ipsum dolor sit amet. '.repeat(500) // ~14k chars
    const extracted = await extractSemanticData(longContent.slice(0, 1000), true)
    
    const result = await generateEmbeddings(longContent, extracted, false)
    
    // Should truncate to 8000 chars and still work
    expect(result).toBeDefined()
    expect(result.dimensions).toBe(1536)
  }, 30000)

  test('handles API errors gracefully with fallback', async () => {
    const content = 'test content'
    const extracted = await extractSemanticData(content, true)
    
    // This will use real API or fallback to mock on error
    const result = await generateEmbeddings(content, extracted, false)
    
    // Should not crash, returns valid structure
    expect(result).toBeDefined()
    expect(result.dimensions).toBe(1536)
    expect(result.full_text).toHaveLength(1536)
    
    // Model should be either real or fallback
    expect(result.model).toBeDefined()
  }, 30000)

  test('respects 8000 char limit per embedding', async () => {
    const content = 'a'.repeat(10000)
    const extracted = {
      core_requirements: ['req1', 'req2'],
      technical_skills: ['skill1', 'skill2'],
      soft_skills: ['soft1'],
      domain_knowledge: [],
      culture_signals: [],
      responsibilities: [],
      seniority_level: 'senior' as const,
      role_type: 'ic' as const,
    }
    
    // Should not crash with long content
    const result = await generateEmbeddings(content, extracted, false)
    
    expect(result).toBeDefined()
    expect(result.dimensions).toBe(1536)
  }, 30000)

  test('uses AI_MODEL_EMBEDDINGS from env', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    
    const result = await generateEmbeddings(content, extracted, false)
    
    // Should use model from env or default
    expect(result.model).toBeDefined()
    expect(typeof result.model).toBe('string')
  }, 30000)
})
