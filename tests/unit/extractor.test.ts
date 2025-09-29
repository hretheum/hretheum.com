// Unit tests for Semantic Extractor - Step 5 (Mock)

import { describe, test, expect } from 'vitest'
import { extractSemanticData, type ExtractedData } from '@/lib/job_postings/extractor'

describe('Semantic Extractor - Step 5 (Mock)', () => {
  test('returns mock data structure', async () => {
    const content = '# Senior Product Designer\n\nRequires 5+ years...'
    const result = await extractSemanticData(content, true)
    
    expect(result).toHaveProperty('core_requirements')
    expect(result).toHaveProperty('technical_skills')
    expect(result).toHaveProperty('soft_skills')
    expect(result).toHaveProperty('domain_knowledge')
    expect(result).toHaveProperty('culture_signals')
    expect(result).toHaveProperty('responsibilities')
    expect(result).toHaveProperty('seniority_level')
    expect(result).toHaveProperty('role_type')
  })

  test('all required fields are arrays or enums', async () => {
    const content = 'test content'
    const result = await extractSemanticData(content, true)
    
    expect(Array.isArray(result.core_requirements)).toBe(true)
    expect(Array.isArray(result.technical_skills)).toBe(true)
    expect(Array.isArray(result.soft_skills)).toBe(true)
    expect(Array.isArray(result.domain_knowledge)).toBe(true)
    expect(Array.isArray(result.culture_signals)).toBe(true)
    expect(Array.isArray(result.responsibilities)).toBe(true)
    expect(typeof result.seniority_level).toBe('string')
    expect(typeof result.role_type).toBe('string')
  })

  test('mock returns expected values', async () => {
    const content = 'test'
    const result = await extractSemanticData(content, true)
    
    expect(result.core_requirements).toContain('5+ years experience')
    expect(result.technical_skills).toContain('React')
    expect(result.technical_skills).toContain('TypeScript')
    expect(result.technical_skills).toContain('Figma')
    expect(result.soft_skills).toContain('Communication')
    expect(result.seniority_level).toBe('senior')
    expect(result.role_type).toBe('ic')
  })

  test('seniority_level is valid enum value', async () => {
    const content = 'test'
    const result = await extractSemanticData(content, true)
    
    const validLevels = ['entry', 'mid', 'senior', 'lead', 'executive', 'unknown']
    expect(validLevels).toContain(result.seniority_level)
  })

  test('role_type is valid enum value', async () => {
    const content = 'test'
    const result = await extractSemanticData(content, true)
    
    const validTypes = ['ic', 'manager', 'hybrid', 'unknown']
    expect(validTypes).toContain(result.role_type)
  })

  test('handles empty content', async () => {
    const content = ''
    const result = await extractSemanticData(content, true)
    
    expect(result).toBeDefined()
    expect(Array.isArray(result.technical_skills)).toBe(true)
  })

  test('handles long content', async () => {
    const content = 'Lorem ipsum '.repeat(1000)
    const result = await extractSemanticData(content, true)
    
    expect(result).toBeDefined()
    expect(result.technical_skills.length).toBeGreaterThan(0)
  })

  test('throws error when useMock=false', async () => {
    await expect(
      extractSemanticData('content', false)
    ).rejects.toThrow('Real LLM extraction not implemented yet')
  })

  test('logs extraction summary', async () => {
    const content = 'test content with some length'
    
    // Capture console.log
    const logs: string[] = []
    const originalLog = console.log
    console.log = (...args) => logs.push(args.join(' '))
    
    await extractSemanticData(content, true)
    
    console.log = originalLog
    
    expect(logs.some(log => log.includes('MOCK extraction'))).toBe(true)
    expect(logs.some(log => log.includes('chars'))).toBe(true)
  })

  test('returns consistent mock data', async () => {
    const result1 = await extractSemanticData('content 1', true)
    const result2 = await extractSemanticData('content 2', true)
    
    // Mock should return same data regardless of input
    expect(result1.technical_skills).toEqual(result2.technical_skills)
    expect(result1.seniority_level).toEqual(result2.seniority_level)
  })

  test('all arrays contain strings', async () => {
    const result = await extractSemanticData('test', true)
    
    result.core_requirements.forEach(item => expect(typeof item).toBe('string'))
    result.technical_skills.forEach(item => expect(typeof item).toBe('string'))
    result.soft_skills.forEach(item => expect(typeof item).toBe('string'))
    result.domain_knowledge.forEach(item => expect(typeof item).toBe('string'))
    result.culture_signals.forEach(item => expect(typeof item).toBe('string'))
    result.responsibilities.forEach(item => expect(typeof item).toBe('string'))
  })

  test('mock data has reasonable array lengths', async () => {
    const result = await extractSemanticData('test', true)
    
    expect(result.core_requirements.length).toBeGreaterThan(0)
    expect(result.technical_skills.length).toBeGreaterThan(0)
    expect(result.soft_skills.length).toBeGreaterThan(0)
    expect(result.domain_knowledge.length).toBeGreaterThan(0)
    expect(result.culture_signals.length).toBeGreaterThan(0)
    expect(result.responsibilities.length).toBeGreaterThan(0)
  })
})
