// Unit tests for User Profile Matcher - Step 3

import { config } from 'dotenv'
import path from 'path'
import { describe, test, expect } from 'vitest'
import { matchUserProfile } from '@/lib/job_postings/profile_matcher'
import type { JobPostingData } from '@/lib/job_postings/queries'

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

const mockJobPosting: JobPostingData = {
  id: 'test-id',
  brand_slug: 'test',
  title: 'Senior Designer',
  content: 'Test content',
  core_requirements: ['5+ years experience'],
  technical_skills: ['React', 'TypeScript', 'Figma'],
  soft_skills: ['Leadership'],
  domain_knowledge: ['FinTech', 'Banking'],
  culture_signals: [],
  responsibilities: [],
  seniority_level: 'senior',
  role_type: 'ic',
  created_at: '2025-01-29T00:00:00Z',
}

describe('User Profile Matcher - Step 3', () => {
  test('matches user skills with job requirements', async () => {
    const match = await matchUserProfile(mockJobPosting)
    
    expect(match).toBeDefined()
    expect(match.skill_overlap).toBeDefined()
    expect(Array.isArray(match.matching_projects)).toBe(true)
  })
  
  test('identifies missing skills', async () => {
    const match = await matchUserProfile(mockJobPosting)
    
    expect(match.skill_overlap.missing).toBeDefined()
    expect(Array.isArray(match.skill_overlap.missing)).toBe(true)
  })
  
  test('finds matching projects', async () => {
    const match = await matchUserProfile(mockJobPosting)
    
    // May have matching projects if user has portfolio data
    expect(Array.isArray(match.matching_projects)).toBe(true)
    
    match.matching_projects.forEach(project => {
      expect(project.similarity_score).toBeGreaterThanOrEqual(0)
      expect(project.similarity_score).toBeLessThanOrEqual(1)
      expect(Array.isArray(project.matching_skills)).toBe(true)
    })
  })
  
  test('returns empty match gracefully when no user documents', async () => {
    // This test will pass even if there are no documents
    const match = await matchUserProfile(mockJobPosting)
    
    expect(match).toBeDefined()
    expect(match.matching_projects).toBeDefined()
    expect(match.skill_overlap).toBeDefined()
  })
  
  test('skill overlap has correct structure', async () => {
    const match = await matchUserProfile(mockJobPosting)
    
    expect(match.skill_overlap).toHaveProperty('technical')
    expect(match.skill_overlap).toHaveProperty('missing')
    expect(match.skill_overlap).toHaveProperty('additional')
    
    expect(Array.isArray(match.skill_overlap.technical)).toBe(true)
    expect(Array.isArray(match.skill_overlap.missing)).toBe(true)
    expect(Array.isArray(match.skill_overlap.additional)).toBe(true)
  })
  
  test('domain_match is boolean', async () => {
    const match = await matchUserProfile(mockJobPosting)
    
    expect(typeof match.domain_match).toBe('boolean')
  })
  
  test('experience_level_match is boolean', async () => {
    const match = await matchUserProfile(mockJobPosting)
    
    expect(typeof match.experience_level_match).toBe('boolean')
  })
  
  test('matching projects have required fields', async () => {
    const match = await matchUserProfile(mockJobPosting)
    
    match.matching_projects.forEach(project => {
      expect(project).toHaveProperty('source_name')
      expect(project).toHaveProperty('role')
      expect(project).toHaveProperty('tech')
      expect(project).toHaveProperty('domain')
      expect(project).toHaveProperty('org')
      expect(project).toHaveProperty('similarity_score')
      expect(project).toHaveProperty('matching_skills')
    })
  })
})