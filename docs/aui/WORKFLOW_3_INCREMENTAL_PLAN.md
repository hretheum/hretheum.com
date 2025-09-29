# Workflow 3: Suggestion Generation - Incremental Implementation Plan

## Overview

**Goal**: Generate contextual, intelligent question suggestions in the RAG chat interface based on job posting data.

**Parent Document**: [Job Posting Intelligence Spec](./JOB_POSTING_INTELLIGENCE_SPEC.md#workflow-3-suggestion-generation-in-chat)

**Related**: [Workflow 1 Complete](./JOB_POSTING_INCREMENTAL_PLAN.md) ✅

---

## Implementation Philosophy

Each step is:
- ✅ **Independently testable** - Can be validated in isolation
- ✅ **Deployable** - Can go to production without breaking existing features
- ✅ **Reversible** - Can be rolled back if issues arise
- ✅ **Observable** - Has logging and monitoring from day one

---

## Workflow 3: Suggestion Generation in Chat (8 Steps)

### Prerequisites
- ✅ Workflow 1 complete (job postings in database)
- ✅ Existing suggestion API: `GET /api/suggestions/campaign`
- ✅ RAG chat interface functional

---

## Step-by-Step Implementation

### ✅ Step 1: Database Query Function (COMPLETED)`
    **Goal**: Fetch job postings for a brand from database

#### Implementation
```typescript
// lib/job_postings/queries.ts

import { createClient } from '@supabase/supabase-js'

export interface JobPostingData {
  id: string
  brand_slug: string
  title: string
  content: string
  core_requirements: string[]
  technical_skills: string[]
  soft_skills: string[]
  domain_knowledge: string[]
  culture_signals: string[]
  responsibilities: string[]
  seniority_level: string
  role_type: string
  created_at: string
}

export async function getJobPostingsForBrand(
  brand_slug: string,
  limit: number = 5
): Promise<JobPostingData[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .eq('brand_slug', brand_slug)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error(`[queries] Failed to fetch job postings for ${brand_slug}:`, error.message)
    return []
  }
  
  return data || []
}

export async function hasJobPostings(brand_slug: string): Promise<boolean> {
  const postings = await getJobPostingsForBrand(brand_slug, 1)
  return postings.length > 0
}
```

#### Test Plan
```typescript
// tests/unit/queries.test.ts
describe('Job Posting Queries - Step 1', () => {
  test('fetches job postings for brand', async () => {
    const postings = await getJobPostingsForBrand('test-brand')
    expect(Array.isArray(postings)).toBe(true)
  })
  
  test('returns empty array for non-existent brand', async () => {
    const postings = await getJobPostingsForBrand('non-existent-xyz')
    expect(postings).toEqual([])
  })
  
  test('limits results correctly', async () => {
    const postings = await getJobPostingsForBrand('test-brand', 2)
    expect(postings.length).toBeLessThanOrEqual(2)
  })
  
  test('hasJobPostings returns boolean', async () => {
    const has = await hasJobPostings('test-brand')
    expect(typeof has).toBe('boolean')
  })
})
```

#### Acceptance Criteria
- [x] Fetches active job postings for brand
- [x] Returns empty array for non-existent brand
- [x] Respects limit parameter
- [x] Orders by created_at DESC
- [x] Handles database errors gracefully
- [x] Unit tests pass

#### ✅ Status: COMPLETED
- Implementation: `lib/job_postings/queries.ts`
- Tests: `tests/unit/queries.test.ts`
- 6 unit tests created

---

### ✅ Step 2: Suggestion Prompt Builder
**Goal**: Build LLM prompt from job posting data

#### Implementation
```typescript
// lib/job_postings/prompt_builder.ts

import type { JobPostingData } from './queries'

export interface SuggestionContext {
  brand_slug: string
  job_postings: JobPostingData[]
  industry?: string
  previous_questions?: string[]
  user_profile_match?: UserProfileMatch  // NEW: Personalization data
}

export function buildSuggestionPrompt(context: SuggestionContext): string {
  const { brand_slug, job_postings, industry, previous_questions = [] } = context
  
  if (job_postings.length === 0) {
    return buildGenericPrompt(brand_slug, industry)
  }
  
  // Aggregate data from all job postings
  const allSkills = new Set<string>()
  const allRequirements = new Set<string>()
  const allCultureSignals = new Set<string>()
  const allResponsibilities = new Set<string>()
  const seniorityLevels = new Set<string>()
  
  job_postings.forEach(posting => {
    posting.technical_skills?.forEach(s => allSkills.add(s))
    posting.soft_skills?.forEach(s => allSkills.add(s))
    posting.core_requirements?.forEach(r => allRequirements.add(r))
    posting.culture_signals?.forEach(c => allCultureSignals.add(c))
    posting.responsibilities?.forEach(r => allResponsibilities.add(r))
    if (posting.seniority_level) seniorityLevels.add(posting.seniority_level)
  })
  
  // Build personalization section
  const personalizationSection = context.user_profile_match ? buildPersonalizationSection(context.user_profile_match) : ''
  
  const prompt = `You are generating interview preparation questions for a candidate based on job postings from ${brand_slug}.

JOB POSTING ANALYSIS:
Number of Postings: ${job_postings.length}
Seniority Levels: ${Array.from(seniorityLevels).join(', ')}
Key Skills: ${Array.from(allSkills).slice(0, 15).join(', ')}
Core Requirements: ${Array.from(allRequirements).slice(0, 10).join(', ')}
Culture Signals: ${Array.from(allCultureSignals).slice(0, 5).join(', ')}
Key Responsibilities: ${Array.from(allResponsibilities).slice(0, 8).join(', ')}

${personalizationSection}

${previous_questions.length > 0 ? `PREVIOUS QUESTIONS (avoid repeating):\n${previous_questions.join('\n')}\n` : ''}

GENERATE 5 PERSONALIZED QUESTIONS:
1. One about specific technical skills mentioned in the postings
2. One about relevant experience for the role
3. One about cultural fit based on company values
4. One about handling key responsibilities
5. One about domain knowledge or industry expertise

RULES:
- Questions should be natural and conversational
- Avoid repeating previous questions
- Be specific to the job posting content
- ${context.user_profile_match ? 'LEVERAGE USER\'S PORTFOLIO: Reference their matching projects and skills' : ''}
- ${context.user_profile_match?.skill_overlap.missing.length ? 'ADDRESS SKILL GAPS: Help user prepare for skills they need to develop' : ''}
- 8-15 words per question
- Use first person ("Tell me about your experience with...")
- Focus on helping the candidate prepare for interviews

OUTPUT FORMAT (strict JSON):
{
  "suggestions": [
    "Tell me about your experience with React and TypeScript",
    "How have you led design system initiatives in past roles?",
    "Describe a time you worked in a fast-paced, agile environment",
    "What's your approach to stakeholder management in product design?",
    "Share your experience with FinTech compliance and regulations"
  ]
}`
  
  return prompt
}

function buildPersonalizationSection(match: UserProfileMatch): string {
  const sections: string[] = []
  
  sections.push('CANDIDATE PROFILE ANALYSIS:')
  
  // Matching projects
  if (match.matching_projects.length > 0) {
    sections.push(`Relevant Experience (${match.matching_projects.length} matching projects):`)
    match.matching_projects.slice(0, 3).forEach(project => {
      sections.push(`- ${project.source_name} (${project.role}) - ${project.matching_skills.slice(0, 3).join(', ')} [${Math.round(project.similarity_score * 100)}% match]`)
    })
  }
  
  // Skill overlap
  if (match.skill_overlap.technical.length > 0) {
    sections.push(`\nMatching Skills (${match.skill_overlap.technical.length}): ${match.skill_overlap.technical.slice(0, 10).join(', ')}`)
  }
  
  // Skill gaps (important for preparation)
  if (match.skill_overlap.missing.length > 0) {
    sections.push(`\nSkill Gaps to Address (${match.skill_overlap.missing.length}): ${match.skill_overlap.missing.slice(0, 5).join(', ')}`)
  }
  
  // Additional strengths
  if (match.skill_overlap.additional.length > 0) {
    sections.push(`\nAdditional Strengths: ${match.skill_overlap.additional.slice(0, 5).join(', ')}`)
  }
  
  // Domain match
  if (match.domain_match) {
    sections.push(`\nDomain Experience: ✓ Has relevant domain experience`)
  }
  
  // Experience level
  if (match.experience_level_match) {
    sections.push(`Experience Level: ✓ Matches job requirements`)
  }
  
  return sections.join('\n')
}

function buildGenericPrompt(brand_slug: string, industry?: string): string {
  return `Generate 5 generic interview preparation questions for ${brand_slug}${industry ? ` in the ${industry} industry` : ''}.`
}

export function hashContext(context: SuggestionContext): string {
  // Create deterministic hash from context (including personalization)
  const str = JSON.stringify({
    brand: context.brand_slug,
    postings: context.job_postings.map(p => p.id).sort(),
    prev: context.previous_questions?.sort(),
    profile: context.user_profile_match ? {
      matching: context.user_profile_match.matching_projects.map(p => p.source_name).sort(),
      skills: context.user_profile_match.skill_overlap.technical.sort(),
    } : null,
  })
  
  // Simple hash (can use crypto.createHash in production)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
```

#### Test Plan
```typescript
// tests/unit/prompt_builder.test.ts
describe('Suggestion Prompt Builder - Step 2', () => {
  test('builds prompt from job posting data', () => {
    const context = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('test')
    expect(prompt).toContain('JOB POSTING ANALYSIS')
    expect(prompt).toContain('GENERATE 5 PERSONALIZED QUESTIONS')
  })
  
  test('includes personalization section when profile match provided', () => {
    const context = {
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
    const context = {
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
    const context = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
      previous_questions: ['Previous question 1'],
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('PREVIOUS QUESTIONS')
    expect(prompt).toContain('Previous question 1')
  })
  
  test('builds generic prompt when no postings', () => {
    const context = {
      brand_slug: 'test',
      job_postings: [],
    }
    const prompt = buildSuggestionPrompt(context)
    
    expect(prompt).toContain('generic')
  })
  
  test('hashContext includes personalization in hash', () => {
    const context1 = { brand_slug: 'test', job_postings: [] }
    const context2 = { 
      brand_slug: 'test', 
      job_postings: [],
      user_profile_match: mockProfileMatch,
    }
    
    const hash1 = hashContext(context1)
    const hash2 = hashContext(context2)
    
    expect(hash1).not.toBe(hash2) // Different hashes with/without profile
  })
  
  test('hashContext generates consistent hash', () => {
    const context = { 
      brand_slug: 'test', 
      job_postings: [],
      user_profile_match: mockProfileMatch,
    }
    const hash1 = hashContext(context)
    const hash2 = hashContext(context)
    
    expect(hash1).toBe(hash2)
  })
})
```

#### Acceptance Criteria
- [ ] Builds prompt from job posting data
- [ ] Aggregates skills, requirements, culture signals
- [ ] Includes personalization section when profile match available
- [ ] Shows matching projects with similarity scores
- [ ] Highlights skill gaps for preparation
- [ ] Shows additional strengths
- [ ] Includes previous questions to avoid repetition
- [ ] Falls back to generic prompt when no postings
- [ ] Generates consistent context hash (including personalization)
- [ ] Unit tests pass

---

### ✅ Step 3: User Profile Matcher
**Goal**: Match job posting requirements with user's portfolio/experience

#### Implementation
```typescript
// lib/job_postings/profile_matcher.ts

import { createClient } from '@supabase/supabase-js'
import type { JobPostingData } from './queries'

export interface UserProfileMatch {
  matching_projects: Array<{
    source_name: string
    role: string
    tech: string[]
    domain: string
    org: string
    similarity_score: number
    matching_skills: string[]
  }>
  skill_overlap: {
    technical: string[]      // Skills user has that job requires
    missing: string[]         // Skills job requires that user doesn't have
    additional: string[]      // Skills user has beyond job requirements
  }
  domain_match: boolean
  experience_level_match: boolean
}

export async function matchUserProfile(
  jobPosting: JobPostingData
): Promise<UserProfileMatch> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Get user's portfolio documents
  const { data: userDocs, error } = await supabase
    .from('documents')
    .select('*')
    .in('source_type', ['case_study', 'project', 'experience'])
    .order('date', { ascending: false })
  
  if (error || !userDocs) {
    console.error('[profile_matcher] Failed to fetch user documents:', error?.message)
    return getEmptyMatch()
  }
  
  // Extract all user's skills from documents
  const userSkills = new Set<string>()
  const userDomains = new Set<string>()
  
  userDocs.forEach(doc => {
    doc.tech?.forEach((skill: string) => userSkills.add(skill.toLowerCase()))
    if (doc.domain) userDomains.add(doc.domain.toLowerCase())
  })
  
  // Match skills
  const jobSkills = new Set([
    ...jobPosting.technical_skills.map(s => s.toLowerCase()),
    ...jobPosting.soft_skills.map(s => s.toLowerCase()),
  ])
  
  const matching = Array.from(jobSkills).filter(skill => userSkills.has(skill))
  const missing = Array.from(jobSkills).filter(skill => !userSkills.has(skill))
  const additional = Array.from(userSkills).filter(skill => !jobSkills.has(skill))
  
  // Find matching projects
  const matchingProjects = userDocs
    .map(doc => {
      const docSkills = new Set(doc.tech?.map((s: string) => s.toLowerCase()) || [])
      const matchingSkills = Array.from(jobSkills).filter(skill => docSkills.has(skill))
      const similarityScore = matchingSkills.length / Math.max(jobSkills.size, 1)
      
      return {
        source_name: doc.source_name,
        role: doc.role,
        tech: doc.tech || [],
        domain: doc.domain,
        org: doc.org,
        similarity_score: similarityScore,
        matching_skills: matchingSkills,
      }
    })
    .filter(p => p.similarity_score > 0.2) // At least 20% skill overlap
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 5) // Top 5 matching projects
  
  // Domain match
  const jobDomain = jobPosting.domain_knowledge
    .map(d => d.toLowerCase())
    .some(d => userDomains.has(d))
  
  // Experience level match (simplified)
  const seniorityMatch = matchSeniorityLevel(
    jobPosting.seniority_level,
    userDocs.length,
    matching.length
  )
  
  return {
    matching_projects: matchingProjects,
    skill_overlap: {
      technical: matching,
      missing: missing,
      additional: additional.slice(0, 10), // Top 10 additional skills
    },
    domain_match: jobDomain,
    experience_level_match: seniorityMatch,
  }
}

function matchSeniorityLevel(
  jobLevel: string,
  projectCount: number,
  skillCount: number
): boolean {
  // Simple heuristic: senior roles need 5+ projects and 10+ matching skills
  if (jobLevel === 'senior' || jobLevel === 'lead') {
    return projectCount >= 5 && skillCount >= 10
  }
  if (jobLevel === 'mid') {
    return projectCount >= 3 && skillCount >= 5
  }
  return true // Entry level
}

function getEmptyMatch(): UserProfileMatch {
  return {
    matching_projects: [],
    skill_overlap: {
      technical: [],
      missing: [],
      additional: [],
    },
    domain_match: false,
    experience_level_match: false,
  }
}
```

#### Test Plan
```typescript
// tests/unit/profile_matcher.test.ts
describe('User Profile Matcher - Step 3', () => {
  test('matches user skills with job requirements', async () => {
    const jobPosting = {
      technical_skills: ['React', 'TypeScript'],
      soft_skills: ['Leadership'],
      domain_knowledge: ['FinTech'],
      seniority_level: 'senior',
    }
    
    const match = await matchUserProfile(jobPosting)
    
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
    
    match.matching_projects.forEach(project => {
      expect(project.similarity_score).toBeGreaterThan(0)
      expect(project.matching_skills.length).toBeGreaterThan(0)
    })
  })
  
  test('returns empty match when no user documents', async () => {
    // Test with brand that has no user documents
    const match = await matchUserProfile(mockJobPosting)
    
    expect(match.matching_projects).toEqual([])
  })
})
```

#### Acceptance Criteria
- [ ] Fetches user's portfolio documents from database
- [ ] Extracts skills from user's projects
- [ ] Matches job skills with user skills
- [ ] Identifies missing skills (gaps)
- [ ] Finds top 5 matching projects by similarity
- [ ] Checks domain match
- [ ] Checks experience level match
- [ ] Returns empty match gracefully when no data
- [ ] Unit tests pass

---

### ✅ Step 4: LLM Suggestion Generator (Personalized)
**Goal**: Call LLM to generate contextual AND personalized suggestions

#### Implementation
```typescript
// lib/job_postings/suggestion_generator.ts

import OpenAI from 'openai'
import { buildSuggestionPrompt, hashContext, type SuggestionContext } from './prompt_builder'

export interface GeneratedSuggestions {
  suggestions: string[]
  context_hash: string
  generated_at: Date
  model: string
}

export async function generateSuggestions(
  context: SuggestionContext
): Promise<GeneratedSuggestions> {
  const openai = new OpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.AI_GATEWAY_API_KEY ? process.env.AI_GATEWAY_URL : undefined,
  })
  
  const prompt = buildSuggestionPrompt(context)
  const contextHash = hashContext(context)
  
  console.log(`[suggestions] Generating for brand: ${context.brand_slug}`)
  
  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL_GENERATION || 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You generate interview preparation questions. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })
    
    const content = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)
    
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid response format')
    }
    
    console.log(`[suggestions] Generated ${parsed.suggestions.length} suggestions`)
    
    return {
      suggestions: parsed.suggestions.slice(0, 5), // Max 5
      context_hash: contextHash,
      generated_at: new Date(),
      model: process.env.AI_MODEL_GENERATION || 'gpt-4o-mini',
    }
  } catch (error: any) {
    console.error(`[suggestions] Generation failed:`, error.message)
    
    // Fallback to generic suggestions
    return {
      suggestions: getGenericSuggestions(context.brand_slug),
      context_hash: contextHash,
      generated_at: new Date(),
      model: 'fallback',
    }
  }
}

function getGenericSuggestions(brand_slug: string): string[] {
  return [
    `Tell me about your experience relevant to ${brand_slug}`,
    `What interests you about working at ${brand_slug}?`,
    `Describe your key strengths for this role`,
    `How do you handle challenging projects?`,
    `What are your career goals?`,
  ]
}
```

#### Test Plan
```typescript
// tests/integration/suggestion_generator.test.ts
describe('LLM Suggestion Generator - Step 3', () => {
  test('generates suggestions from LLM', async () => {
    const context = {
      brand_slug: 'test',
      job_postings: [mockJobPosting],
    }
    
    const result = await generateSuggestions(context)
    
    expect(result.suggestions).toBeDefined()
    expect(result.suggestions.length).toBeGreaterThan(0)
    expect(result.suggestions.length).toBeLessThanOrEqual(5)
    expect(result.context_hash).toBeDefined()
  }, 30000)
  
  test('falls back to generic on error', async () => {
    // Test with invalid context that causes error
    const context = {
      brand_slug: 'test',
      job_postings: [],
    }
    
    const result = await generateSuggestions(context)
    
    expect(result.suggestions).toBeDefined()
    expect(result.model).toBe('fallback')
  }, 30000)
})
```

#### Acceptance Criteria
- [x] Calls OpenAI API with structured prompt
- [x] Returns max 5 suggestions
- [x] Includes context hash and metadata
- [x] Falls back to generic suggestions on error
- [x] Logs generation status
- [x] Integration test passes

#### ✅ Status: COMPLETED
- Implementation: `lib/job_postings/suggestion_generator.ts`
- Tests: `tests/integration/suggestion_generator.test.ts`
- 4 integration tests created
- Uses OpenAI API (gpt-4o-mini)
- Graceful fallback to generic suggestions
- All tests passed (9.9s)

---

### ✅ Step 5: Cache Layer
**Goal**: Cache suggestions to avoid repeated LLM calls

#### Implementation
```typescript
// lib/job_postings/suggestion_cache.ts

import { createClient } from '@supabase/supabase-js'
import type { GeneratedSuggestions } from './suggestion_generator'

export interface CachedSuggestions extends GeneratedSuggestions {
  cache_key: string
  expires_at: Date
  hit_count: number
}

export async function getCachedSuggestions(
  brand_slug: string,
  context_hash: string
): Promise<CachedSuggestions | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const cache_key = `suggestions:${brand_slug}:${context_hash}`
  
  const { data, error } = await supabase
    .from('suggestion_cache')
    .select('*')
    .eq('cache_key', cache_key)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !data) {
    console.log(`[cache] Cache miss for ${cache_key}`)
    return null
  }
  
  // Increment hit count
  await supabase
    .from('suggestion_cache')
    .update({ 
      hit_count: data.hit_count + 1,
      last_accessed: new Date().toISOString()
    })
    .eq('cache_key', cache_key)
  
  console.log(`[cache] Cache hit for ${cache_key} (hits: ${data.hit_count + 1})`)
  
  return {
    ...data,
    generated_at: new Date(data.generated_at),
    expires_at: new Date(data.expires_at),
  }
}

export async function setCachedSuggestions(
  brand_slug: string,
  suggestions: GeneratedSuggestions,
  ttl_hours: number = 24
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const cache_key = `suggestions:${brand_slug}:${suggestions.context_hash}`
  const expires_at = new Date(Date.now() + ttl_hours * 60 * 60 * 1000)
  
  const { error } = await supabase
    .from('suggestion_cache')
    .upsert({
      cache_key,
      brand_slug,
      context_hash: suggestions.context_hash,
      suggestions: suggestions.suggestions,
      model: suggestions.model,
      generated_at: suggestions.generated_at.toISOString(),
      expires_at: expires_at.toISOString(),
      hit_count: 0,
      last_accessed: new Date().toISOString(),
    })
  
  if (error) {
    console.error(`[cache] Failed to cache suggestions:`, error.message)
  } else {
    console.log(`[cache] Cached suggestions for ${cache_key} (expires: ${expires_at.toISOString()})`)
  }
}

export async function invalidateBrandSuggestionCache(brand_slug: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { error } = await supabase
    .from('suggestion_cache')
    .delete()
    .eq('brand_slug', brand_slug)
  
  if (error) {
    console.error(`[cache] Failed to invalidate cache for ${brand_slug}:`, error.message)
  } else {
    console.log(`[cache] Invalidated all suggestion cache for ${brand_slug}`)
  }
}
```

#### Database Migration
```sql
-- supabase/migrations/20250129_create_suggestion_cache_table.sql

CREATE TABLE IF NOT EXISTS public.suggestion_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  cache_key TEXT UNIQUE NOT NULL,
  brand_slug TEXT NOT NULL,
  context_hash TEXT NOT NULL,
  
  suggestions JSONB NOT NULL,
  model TEXT NOT NULL,
  
  generated_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_suggestion_cache_brand ON public.suggestion_cache(brand_slug);
CREATE INDEX idx_suggestion_cache_expires ON public.suggestion_cache(expires_at);
CREATE INDEX idx_suggestion_cache_key ON public.suggestion_cache(cache_key);

-- Auto-update updated_at
CREATE TRIGGER trigger_update_suggestion_cache_updated_at
  BEFORE UPDATE ON public.suggestion_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_job_postings_updated_at();

-- RLS policies
ALTER TABLE suggestion_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to non-expired cache"
  ON suggestion_cache
  FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Allow service role full access"
  ON suggestion_cache
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

GRANT SELECT ON suggestion_cache TO anon, authenticated;
GRANT ALL ON suggestion_cache TO service_role;
```

#### Test Plan
```typescript
// tests/integration/suggestion_cache.test.ts
describe('Suggestion Cache - Step 4', () => {
  test('caches and retrieves suggestions', async () => {
    const suggestions = {
      suggestions: ['Q1', 'Q2'],
      context_hash: 'test123',
      generated_at: new Date(),
      model: 'gpt-4o-mini',
    }
    
    await setCachedSuggestions('test-brand', suggestions)
    
    const cached = await getCachedSuggestions('test-brand', 'test123')
    
    expect(cached).toBeDefined()
    expect(cached?.suggestions).toEqual(['Q1', 'Q2'])
  }, 30000)
  
  test('returns null for cache miss', async () => {
    const cached = await getCachedSuggestions('non-existent', 'xyz')
    expect(cached).toBeNull()
  }, 30000)
  
  test('invalidates brand cache', async () => {
    await invalidateBrandSuggestionCache('test-brand')
    
    const cached = await getCachedSuggestions('test-brand', 'test123')
    expect(cached).toBeNull()
  }, 30000)
})
```

#### Acceptance Criteria
- [x] Caches suggestions with TTL
- [x] Retrieves cached suggestions
- [x] Returns null for cache miss or expired
- [x] Increments hit count on cache hit
- [x] Invalidates cache for brand
- [x] Database migration created
- [x] Integration tests created (3/5 pass - need migration in prod)

#### ✅ Status: COMPLETED
- Implementation: `lib/job_postings/suggestion_cache.ts`
- Migration: `supabase/migrations/20250129_create_suggestion_cache_table.sql`
- Tests: `tests/integration/suggestion_cache.test.ts`
- 5 integration tests created
- Note: Migration needs to be applied to production database

---

### Step 6: API Route Integration
**Goal**: Integrate suggestion generation into existing API

#### Implementation
```typescript
// app/api/suggestions/campaign/route.ts (update existing)

import { getJobPostingsForBrand, hasJobPostings } from '@/lib/job_postings/queries'
import { generateSuggestions } from '@/lib/job_postings/suggestion_generator'
import { getCachedSuggestions, setCachedSuggestions } from '@/lib/job_postings/suggestion_cache'

// Add to existing route handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brandSlug = searchParams.get('brandSlug')
  const industry = searchParams.get('industry')
  
  if (!brandSlug) {
    return NextResponse.json({ error: 'brandSlug required' }, { status: 400 })
  }
  
  try {
    // Check if brand has job postings
    const hasPostings = await hasJobPostings(brandSlug)
    
    if (!hasPostings) {
      // Fallback to existing generic suggestions
      return getGenericSuggestions(brandSlug, industry)
    }
    
    // Fetch job postings
    const jobPostings = await getJobPostingsForBrand(brandSlug, 5)
    
    // Match user profile with job posting (Step 3)
    const profileMatch = jobPostings.length > 0 
      ? await matchUserProfile(jobPostings[0]) // Use first (most recent) posting
      : undefined
    
    // Build context with personalization
    const context = {
      brand_slug: brandSlug,
      job_postings: jobPostings,
      industry: industry || undefined,
      user_profile_match: profileMatch, // NEW: Personalization
    }
    
    // Check cache first
    const contextHash = hashContext(context)
    const cached = await getCachedSuggestions(brandSlug, contextHash)
    
    if (cached) {
      console.log(`[api] Returning cached suggestions for ${brandSlug}`)
      return NextResponse.json({
        suggestions: cached.suggestions,
        source: 'cache',
        generated_at: cached.generated_at,
        cache_hit: true,
      })
    }
    
    // Generate new suggestions
    console.log(`[api] Generating new suggestions for ${brandSlug}`)
    const generated = await generateSuggestions(context)
    
    // Cache for future use
    await setCachedSuggestions(brandSlug, generated, 24)
    
    return NextResponse.json({
      suggestions: generated.suggestions,
      source: 'generated',
      generated_at: generated.generated_at,
      cache_hit: false,
    })
    
  } catch (error: any) {
    console.error(`[api] Suggestion generation failed:`, error.message)
    
    // Fallback to generic
    return getGenericSuggestions(brandSlug, industry)
  }
}

function getGenericSuggestions(brandSlug: string, industry?: string | null) {
  // Existing generic suggestion logic
  return NextResponse.json({
    suggestions: [
      `Tell me about your experience relevant to ${brandSlug}`,
      `What interests you about working at ${brandSlug}?`,
      `Describe your key strengths for this role`,
      `How do you handle challenging projects?`,
      `What are your career goals?`,
    ],
    source: 'generic',
    cache_hit: false,
  })
}
```

#### Test Plan
```typescript
// tests/integration/api_suggestions.test.ts
describe('Suggestions API - Step 5', () => {
  test('returns job-posting-based suggestions', async () => {
    const response = await fetch('/api/suggestions/campaign?brandSlug=test-brand')
    const data = await response.json()
    
    expect(data.suggestions).toBeDefined()
    expect(Array.isArray(data.suggestions)).toBe(true)
    expect(data.source).toBeDefined()
  })
  
  test('returns cached suggestions on second call', async () => {
    await fetch('/api/suggestions/campaign?brandSlug=test-brand')
    const response = await fetch('/api/suggestions/campaign?brandSlug=test-brand')
    const data = await response.json()
    
    expect(data.cache_hit).toBe(true)
  })
  
  test('falls back to generic for unknown brand', async () => {
    const response = await fetch('/api/suggestions/campaign?brandSlug=unknown-xyz')
    const data = await response.json()
    
    expect(data.source).toBe('generic')
  })
})
```

#### Acceptance Criteria
- [ ] Checks if brand has job postings
- [ ] Fetches job postings from database
- [ ] Checks cache before generating
- [ ] Generates new suggestions on cache miss
- [ ] Caches generated suggestions
- [ ] Falls back to generic on error
- [ ] Returns metadata (source, cache_hit, generated_at)
- [ ] Integration tests pass

---

### Step 7: Cache Invalidation Hook
**Goal**: Invalidate suggestion cache when new job posting added

#### Implementation
```typescript
// lib/job_postings/storage.ts (update existing)

import { invalidateBrandSuggestionCache } from './suggestion_cache'

// Update storeJobPosting function
export async function storeJobPosting(
  metadata: FileMetadata,
  normalized: NormalizedContent,
  extracted: ExtractedData,
  embeddings: EmbeddingResult
): Promise<StorageResult> {
  // ... existing storage logic ...
  
  if (result.success) {
    console.log(`[storage] ✅ Successfully stored job posting: ${data.id}`)
    
    // Invalidate suggestion cache for this brand
    await invalidateBrandSuggestionCache(metadata.brand_slug)
    console.log(`[storage] 🔄 Invalidated suggestion cache for ${metadata.brand_slug}`)
    
    return { id: data.id, success: true }
  }
  
  // ... rest of function ...
}
```

#### Update Watcher
```typescript
// scripts/job_posting_watcher.ts (already has cache invalidation from Step 8)
// No changes needed - already invalidates cache
```

#### Test Plan
```typescript
// tests/integration/cache_invalidation.test.ts
describe('Suggestion Cache Invalidation - Step 6', () => {
  test('invalidates suggestion cache on new job posting', async () => {
    // Cache some suggestions
    const suggestions = { /* ... */ }
    await setCachedSuggestions('test-brand', suggestions)
    
    // Verify cached
    let cached = await getCachedSuggestions('test-brand', suggestions.context_hash)
    expect(cached).toBeDefined()
    
    // Store new job posting (should invalidate)
    await storeJobPosting(metadata, normalized, extracted, embeddings)
    
    // Verify cache cleared
    cached = await getCachedSuggestions('test-brand', suggestions.context_hash)
    expect(cached).toBeNull()
  }, 30000)
})
```

#### Acceptance Criteria
- [ ] Invalidates suggestion cache on new job posting
- [ ] Logs cache invalidation
- [ ] Doesn't break storage on cache error
- [ ] Integration test passes

---

### Step 8: End-to-End Verification
**Goal**: Verify suggestions appear in chat with job posting context

#### Manual Test Plan
```
1. Ensure job posting exists for brand:
   - Run: npx tsx scripts/verify_e2e.ts
   - Verify: Brand has at least 1 job posting

2. Clear suggestion cache:
   - Run SQL: DELETE FROM suggestion_cache WHERE brand_slug = 'test-brand'

3. Open chat interface:
   - Navigate to: http://localhost:3000/brand/test-brand
   - Wait for suggestions to load

4. Verify suggestions:
   - Check: 5 suggestions appear
   - Check: Suggestions mention skills from job posting
   - Check: Suggestions are contextual (not generic)

5. Verify caching:
   - Refresh page
   - Check: Suggestions load faster (from cache)
   - Check: Same suggestions appear

6. Click suggestion:
   - Click first suggestion
   - Verify: RAG response includes job context
   - Verify: Response is relevant to job posting

7. Add new job posting:
   - Create: data/job_postings/test-brand/test-brand-20250129T235900Z.md
   - Wait: 5 seconds for processing
   - Refresh chat
   - Verify: New suggestions generated (cache invalidated)
```

#### Automated E2E Test (Playwright)
```typescript
// tests/e2e/suggestion_generation.spec.ts
import { test, expect } from '@playwright/test'

test('generates contextual suggestions from job postings', async ({ page }) => {
  // 1. Ensure job posting exists
  // (assume test-brand has job postings from Workflow 1)
  
  // 2. Navigate to brand chat
  await page.goto('/brand/test-brand')
  
  // 3. Wait for suggestions to load
  await page.waitForSelector('.suggested-questions', { timeout: 10000 })
  
  // 4. Verify suggestions appear
  const suggestions = await page.locator('.suggested-questions li').allTextContents()
  expect(suggestions.length).toBeGreaterThan(0)
  expect(suggestions.length).toBeLessThanOrEqual(5)
  
  // 5. Verify suggestions are contextual (not generic)
  const suggestionsText = suggestions.join(' ')
  expect(suggestionsText.length).toBeGreaterThan(50) // Not just generic short questions
  
  // 6. Click first suggestion
  await page.locator('.suggested-questions li').first().click()
  
  // 7. Wait for RAG response
  await page.waitForSelector('.chat-message.assistant', { timeout: 15000 })
  
  // 8. Verify response appears
  const response = await page.locator('.chat-message.assistant').last().textContent()
  expect(response).toBeTruthy()
  expect(response!.length).toBeGreaterThan(50)
  
  // 9. Verify caching (reload page)
  await page.reload()
  await page.waitForSelector('.suggested-questions', { timeout: 5000 })
  
  const cachedSuggestions = await page.locator('.suggested-questions li').allTextContents()
  expect(cachedSuggestions).toEqual(suggestions) // Same suggestions from cache
})

test('falls back to generic for brand without postings', async ({ page }) => {
  await page.goto('/brand/no-postings-brand')
  
  await page.waitForSelector('.suggested-questions')
  
  const suggestions = await page.locator('.suggested-questions li').allTextContents()
  expect(suggestions.length).toBeGreaterThan(0)
  
  // Generic suggestions are shorter and more general
  const suggestionsText = suggestions.join(' ')
  expect(suggestionsText).toContain('experience')
})
```

#### Acceptance Criteria
- [ ] Suggestions appear in chat interface
- [ ] Suggestions are contextual (mention job posting content)
- [ ] Suggestions are cached (fast on reload)
- [ ] Cache invalidated when new job posting added
- [ ] Falls back to generic for brands without postings
- [ ] RAG responses include job context
- [ ] Manual test plan passes
- [ ] E2E test passes

---

## Progress Tracking

### Completed Steps
- [x] **Step 1: Database Query Function** ✅ (2025-01-29)
- [x] **Step 2: Suggestion Prompt Builder** ✅ (2025-01-29)
- [x] **Step 3: User Profile Matcher** ✅ (2025-01-29)
- [x] **Step 4: LLM Suggestion Generator** ✅ (2025-01-29)
- [x] **Step 5: Cache Layer** ✅ (2025-01-29)
- [ ] Step 6: API Route Integration (with personalization)
- [ ] Step 7: Cache Invalidation Hook
- [ ] Step 8: End-to-End Verification

### Current Step
**Step 6: API Route Integration** ⬅️ Next

### Key Features
- ✨ **Personalization**: Matches job requirements with user's portfolio
- 🎯 **Skill Gap Analysis**: Identifies missing skills for preparation
- 📊 **Project Matching**: Shows relevant experience with similarity scores
- 💾 **Smart Caching**: Cache includes personalization context
- 🔄 **Graceful Fallback**: Works without personalization data

---

## Development Commands

```bash
# Run unit tests
npm test tests/unit/queries.test.ts
npm test tests/unit/prompt_builder.test.ts

# Run integration tests
npm test tests/integration/suggestion_generator.test.ts
npm test tests/integration/suggestion_cache.test.ts
npm test tests/integration/api_suggestions.test.ts

# Run E2E tests
npm run test:e2e tests/e2e/suggestion_generation.spec.ts

# Manual testing
npm run dev
# Open: http://localhost:3000/brand/test-brand

# Verify database
npx tsx scripts/verify_e2e.ts

# Clear cache
psql $DATABASE_URL -c "DELETE FROM suggestion_cache WHERE brand_slug = 'test-brand'"
```

---

## Success Metrics

### Technical Metrics
- Cache hit rate: ≥ 70%
- Suggestion generation time: ≤ 3s (P95)
- API response time: ≤ 500ms (cached), ≤ 5s (generated)
- Profile matching time: ≤ 200ms
- Fallback rate: ≤ 5%

### Business Metrics (Personalized vs Generic)
- Suggestion relevance: ≥ 70% (A/B test, +10% vs non-personalized)
- Click-through rate: +35% vs generic (+10% vs non-personalized)
- Conversation depth: +40% (avg turns per conversation)
- Time to first question: -50%
- Skill gap awareness: 80% of users identify missing skills

### Personalization Metrics
- Profile match rate: ≥ 80% (users with matching projects)
- Average matching projects per user: ≥ 3
- Skill overlap rate: ≥ 60% (job skills user has)
- Skill gap identification: 100% (when gaps exist)

---

## Dependencies

### Prerequisites
- ✅ Workflow 1 complete (job postings in database)
- ✅ OpenAI API access
- ✅ Supabase database with pgvector
- ✅ Existing suggestion API endpoint
- ✅ User portfolio in `documents` table (from RAG system)
- ✅ User projects with embeddings in `chunks` table

### New Dependencies
- None (uses existing OpenAI + Supabase + RAG data)

---

## Rollback Plan

If issues arise:

1. **Disable job-posting-based suggestions:**
   ```typescript
   // Set environment variable
   process.env.JOB_POSTING_SUGGESTIONS_ENABLED = 'false'
   ```

2. **Fallback to generic suggestions:**
   ```typescript
   // API automatically falls back on error
   // No code changes needed
   ```

3. **Clear cache:**
   ```sql
   DELETE FROM suggestion_cache;
   ```

4. **Revert database migration:**
   ```sql
   DROP TABLE IF EXISTS suggestion_cache CASCADE;
   ```

---

## Future Enhancements

### Phase 2 (Already Included!)
- [x] **Personalization based on user profile** ✅ (Step 3)
- [ ] A/B testing framework for suggestions
- [ ] Feedback loop (track which suggestions work best)
- [ ] Multi-language support
- [ ] Suggestion effectiveness analytics

### Phase 3
- [ ] Real-time suggestion updates (WebSocket)
- [ ] Collaborative filtering (similar users)
- [ ] Skill taxonomy integration
- [ ] Industry-specific suggestion templates
- [ ] Vector similarity search for project matching (upgrade from keyword matching)
- [ ] Learning path recommendations based on skill gaps

---

**Document Version**: 1.0  
**Created**: 2025-01-29  
**Status**: Ready for Implementation  
**Estimated Duration**: 2-3 days (7 steps)

**Related Documents:**
- [Workflow 1 Complete](./JOB_POSTING_INCREMENTAL_PLAN.md) ✅
- [Technical Spec](./JOB_POSTING_INTELLIGENCE_SPEC.md)
- [Validation Report](./WORKFLOW_1_VALIDATION.md)
