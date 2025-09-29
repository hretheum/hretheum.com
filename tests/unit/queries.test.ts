// Unit tests for Job Posting Queries - Step 1

import { describe, test, expect } from 'vitest'
import { getJobPostingsForBrand, hasJobPostings } from '@/lib/job_postings/queries'

describe('Job Posting Queries - Step 1', () => {
  test('fetches job postings for brand', async () => {
    const postings = await getJobPostingsForBrand('e2e-test')
    
    expect(Array.isArray(postings)).toBe(true)
    // May be empty if no postings exist, but should not throw
  })
  
  test('returns empty array for non-existent brand', async () => {
    const postings = await getJobPostingsForBrand('non-existent-brand-xyz-123')
    
    expect(postings).toEqual([])
    expect(Array.isArray(postings)).toBe(true)
  })
  
  test('limits results correctly', async () => {
    const postings = await getJobPostingsForBrand('e2e-test', 2)
    
    expect(postings.length).toBeLessThanOrEqual(2)
  })
  
  test('hasJobPostings returns boolean', async () => {
    const has = await hasJobPostings('e2e-test')
    
    expect(typeof has).toBe('boolean')
  })
  
  test('hasJobPostings returns false for non-existent brand', async () => {
    const has = await hasJobPostings('non-existent-xyz-123')
    
    expect(has).toBe(false)
  })
  
  test('returned postings have correct structure', async () => {
    const postings = await getJobPostingsForBrand('e2e-test')
    
    if (postings.length > 0) {
      const posting = postings[0]
      
      expect(posting).toHaveProperty('id')
      expect(posting).toHaveProperty('brand_slug')
      expect(posting).toHaveProperty('technical_skills')
      expect(posting).toHaveProperty('core_requirements')
      expect(posting).toHaveProperty('seniority_level')
      expect(posting).toHaveProperty('role_type')
      
      expect(Array.isArray(posting.technical_skills)).toBe(true)
      expect(Array.isArray(posting.core_requirements)).toBe(true)
    }
  })
})
