// Integration tests for LLM Semantic Extractor - Step 5b (Real)

import { describe, test, expect } from 'vitest'
import { extractSemanticData } from '@/lib/job_postings/extractor'

describe('LLM Semantic Extractor - Step 5b (Real)', () => {
  test('extracts data from real job posting', async () => {
    const jobPosting = `
# Senior Product Designer

## Requirements
- 5+ years of product design experience
- Strong portfolio demonstrating end-to-end design process
- Experience with React, TypeScript, and Figma
- Excellent communication skills
- Bachelor's degree in Design or related field

## Responsibilities
- Lead design system initiatives
- Collaborate with engineering and product teams
- Conduct user research and usability testing
- Mentor junior designers

## About Us
We're a fast-paced FinTech startup building the future of payments.
    `
    
    const result = await extractSemanticData(jobPosting, false)
    
    // Verify structure
    expect(result).toBeDefined()
    expect(Array.isArray(result.technical_skills)).toBe(true)
    expect(Array.isArray(result.core_requirements)).toBe(true)
    expect(Array.isArray(result.responsibilities)).toBe(true)
    
    // Verify extracted content
    expect(result.technical_skills.length).toBeGreaterThan(0)
    expect(result.core_requirements.length).toBeGreaterThan(0)
    expect(result.seniority_level).toBe('senior')
    
    // Check for expected skills (LLM should extract these)
    const skillsStr = result.technical_skills.join(' ').toLowerCase()
    expect(skillsStr).toMatch(/react|typescript|figma/)
  }, 30000)  // 30s timeout for LLM call

  test('handles empty content gracefully', async () => {
    const result = await extractSemanticData('', false)
    
    expect(result).toBeDefined()
    expect(Array.isArray(result.technical_skills)).toBe(true)
    expect(result.seniority_level).toBe('unknown')
  }, 30000)

  test('handles minimal content', async () => {
    const result = await extractSemanticData('Looking for a designer', false)
    
    expect(result).toBeDefined()
    expect(result.seniority_level).toBeDefined()
  }, 30000)

  test('extracts seniority level correctly', async () => {
    const jobPosting = `
# Junior Frontend Developer

We're looking for a junior developer to join our team.

Requirements:
- 1-2 years of experience
- Knowledge of HTML, CSS, JavaScript
    `
    
    const result = await extractSemanticData(jobPosting, false)
    
    expect(['entry', 'mid', 'junior']).toContain(result.seniority_level.toLowerCase())
  }, 30000)

  test('extracts role type correctly', async () => {
    const jobPosting = `
# Engineering Manager

Lead a team of 5 engineers building our core product.

Requirements:
- 3+ years of management experience
- Strong technical background
    `
    
    const result = await extractSemanticData(jobPosting, false)
    
    expect(['manager', 'hybrid']).toContain(result.role_type)
  }, 30000)

  test('respects 4000 token limit', async () => {
    const longContent = 'Lorem ipsum dolor sit amet. '.repeat(500)
    
    const result = await extractSemanticData(longContent, false)
    
    // Should not crash and should return valid structure
    expect(result).toBeDefined()
    expect(Array.isArray(result.technical_skills)).toBe(true)
  }, 30000)

  test('handles API errors gracefully', async () => {
    // This test will use invalid API key scenario if env is not set
    const result = await extractSemanticData('test content', false)
    
    // Should return empty structure on error, not throw
    expect(result).toBeDefined()
    expect(Array.isArray(result.technical_skills)).toBe(true)
  }, 30000)
})
