// Unit tests for Embedding Generator - Step 6 (Mock)

import { describe, test, expect } from 'vitest'
import { generateEmbeddings } from '@/lib/job_postings/embeddings'
import { extractSemanticData } from '@/lib/job_postings/extractor'

describe('Embedding Generator - Step 6 (Mock)', () => {
  test('generates mock embeddings with correct dimensions', async () => {
    const content = 'test content'
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    expect(result.full_text).toHaveLength(1536)
    expect(result.requirements).toHaveLength(1536)
    expect(result.skills).toHaveLength(1536)
    expect(result.dimensions).toBe(1536)
  })

  test('all three embedding types are generated', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    expect(result).toHaveProperty('full_text')
    expect(result).toHaveProperty('requirements')
    expect(result).toHaveProperty('skills')
    expect(Array.isArray(result.full_text)).toBe(true)
    expect(Array.isArray(result.requirements)).toBe(true)
    expect(Array.isArray(result.skills)).toBe(true)
  })

  test('vectors contain normalized values in range [-1, 1]', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    // Check full_text values
    result.full_text.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(-1)
      expect(val).toBeLessThanOrEqual(1)
      expect(typeof val).toBe('number')
    })
    
    // Check requirements values
    result.requirements.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(-1)
      expect(val).toBeLessThanOrEqual(1)
    })
    
    // Check skills values
    result.skills.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(-1)
      expect(val).toBeLessThanOrEqual(1)
    })
  })

  test('includes model metadata', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    expect(result.model).toBe('mock-embedding-model')
    expect(result.dimensions).toBe(1536)
  })

  test('generates different vectors for each type', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    // Vectors should be different (random)
    const fullTextSum = result.full_text.reduce((a, b) => a + b, 0)
    const requirementsSum = result.requirements.reduce((a, b) => a + b, 0)
    const skillsSum = result.skills.reduce((a, b) => a + b, 0)
    
    // With 1536 random values, sums should be different
    expect(fullTextSum).not.toBe(requirementsSum)
    expect(fullTextSum).not.toBe(skillsSum)
    expect(requirementsSum).not.toBe(skillsSum)
  })

  test('handles empty content', async () => {
    const content = ''
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    expect(result.full_text).toHaveLength(1536)
    expect(result.dimensions).toBe(1536)
  })

  test('handles long content', async () => {
    const content = 'Lorem ipsum '.repeat(1000)
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    expect(result.full_text).toHaveLength(1536)
  })

  test('throws error when useMock=false', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    
    await expect(
      generateEmbeddings(content, extracted, false)
    ).rejects.toThrow('Real embedding generation not implemented yet')
  })

  test('logs embedding generation', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    
    // Capture console.log
    const logs: string[] = []
    const originalLog = console.log
    console.log = (...args) => logs.push(args.join(' '))
    
    await generateEmbeddings(content, extracted, true)
    
    console.log = originalLog
    
    expect(logs.some(log => log.includes('MOCK embeddings'))).toBe(true)
  })

  test('vectors are all numbers', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    result.full_text.forEach(val => expect(typeof val).toBe('number'))
    result.requirements.forEach(val => expect(typeof val).toBe('number'))
    result.skills.forEach(val => expect(typeof val).toBe('number'))
  })

  test('no NaN or Infinity values', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    result.full_text.forEach(val => {
      expect(isNaN(val)).toBe(false)
      expect(isFinite(val)).toBe(true)
    })
  })
})
