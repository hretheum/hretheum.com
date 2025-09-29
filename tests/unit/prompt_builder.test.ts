// Unit tests for Suggestion Prompt Builder - Step 2

import { describe, test, expect } from 'vitest'
import { buildSuggestionPrompt, hashContext, type SuggestionContext, type UserProfileMatch } from '@/lib/job_postings/prompt_builder'
import type { JobPostingData } from '@/lib/job_postings/queries'

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

const mockProfileMatch: UserProfileMatch = {
  matching_projects: [
    {
      source_name: 'Bank BPH Conversion',
      role: 'UX Lead',
      tech: ['React', 'TypeScript'],
      domain: 'banking',
      org: 'Bank BPH',
      similarity_score: 0.8,
      matching_skills: ['React', 'TypeScript'],
    },
  ],
  skill_overlap: {
    technical: ['React', 'TypeScript'],
    missing: ['Kubernetes', 'Docker'],
    additional: ['Python', 'Django'],
  },
  domain_match: true,
  experience_level_match: true,
}

describe('Suggestion Prompt Builder - Step 2', () => {
  test('builds prompt from job posting data', () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('test')
    expect(prompt).toContain('JOB POSTING ANALYSIS')
    expect(prompt).toContain('GENERATE 5 PERSONALIZED QUESTIONS')
  })
  
  test('includes personalization section when profile match provided', () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
      user_profile_match: mockProfileMatch,
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('CANDIDATE PROFILE ANALYSIS')
    expect(prompt).toContain('Relevant Experience')
    expect(prompt).toContain('Matching Skills')
  })
  
  test('includes skill gaps in prompt', () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
      user_profile_match: {
        ...mockProfileMatch,
        skill_overlap: {
          technical: ['React'],
          missing: ['Kubernetes', 'Docker'],
          additional: [],
        },
      },
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('Skill Gaps to Address')
    expect(prompt).toContain('ADDRESS SKILL GAPS')
  })
  
  test('includes previous questions in prompt', () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
      previous_questions: ['Previous question 1'],
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('PREVIOUS QUESTIONS')
    expect(prompt).toContain('Previous question 1')
  })
  
  test('builds generic prompt when no postings', () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [],
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('generic')
  })
  
  test('hashContext includes personalization in hash', () => {
    const context1: SuggestionContext = { 
      brand_slug: 'test', 
      job_postings: [] 
    }
    const context2: SuggestionContext = { 
      brand_slug: 'test', 
      job_postings: [],
      user_profile_match: mockProfileMatch,
    }
    
    const hash1 = hashContext(context1)
    const hash2 = hashContext(context2)
    
    expect(hash1).not.toBe(hash2) // Different hashes with/without profile
  })
  
  test('hashContext generates consistent hash', () => {
    const context: SuggestionContext = { 
      brand_slug: 'test', 
      job_postings: [],
      user_profile_match: mockProfileMatch,
    }
    const hash1 = hashContext(context)
    const hash2 = hashContext(context)
    
    expect(hash1).toBe(hash2)
  })
  
  test('aggregates skills from multiple job postings', () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [
        mockJobPosting,
        { ...mockJobPosting, id: 'test-id-2', technical_skills: ['Vue', 'Python'] },
      ],
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('Number of Postings: 2')
  })
  
  test('shows matching projects with similarity scores', () => {
    const context: SuggestionContext = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
      user_profile_match: mockProfileMatch,
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('Bank BPH Conversion')
    expect(prompt).toContain('80% match')
  })
})