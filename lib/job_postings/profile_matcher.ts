// User Profile Matcher - Step 3
// Match job posting requirements with user's portfolio/experience
// Phase 5: Added semantic matching with embeddings

import { createClient } from '@supabase/supabase-js'
import { searchByEmbedding } from '@/lib/rag_store/supabase'
import { OpenAIEmbeddings } from '@langchain/openai'
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
  
  console.log(`[profile_matcher] Matching user profile with job posting: ${jobPosting.id}`)
  
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
  
  console.log(`[profile_matcher] Found ${userDocs.length} user documents`)
  
  // Extract all user's skills from documents
  const userSkills = new Set<string>()
  const userDomains = new Set<string>()
  
  userDocs.forEach(doc => {
    doc.tech?.forEach((skill: string) => userSkills.add(skill.toLowerCase()))
    if (doc.domain) userDomains.add(doc.domain.toLowerCase())
  })
  
  console.log(`[profile_matcher] User has ${userSkills.size} unique skills`)
  
  // Match skills
  const jobSkills = new Set([
    ...jobPosting.technical_skills.map(s => s.toLowerCase()),
    ...jobPosting.soft_skills.map(s => s.toLowerCase()),
  ])
  
  const matching = Array.from(jobSkills).filter(skill => userSkills.has(skill))
  const missing = Array.from(jobSkills).filter(skill => !userSkills.has(skill))
  const additional = Array.from(userSkills).filter(skill => !jobSkills.has(skill))
  
  console.log(`[profile_matcher] Skill overlap: ${matching.length} matching, ${missing.length} missing`)
  
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
  
  console.log(`[profile_matcher] Found ${matchingProjects.length} matching projects`)
  
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

/**
 * Phase 5: Semantic Profile Matching
 * Uses embeddings to find semantically similar projects
 * 
 * @param jobPosting - Job posting to match against
 * @returns Profile match with semantic similarity scores
 */
export async function matchUserProfileSemantic(
  jobPosting: JobPostingData
): Promise<UserProfileMatch> {
  const startTime = Date.now()
  const useSemanticMatching = process.env.ENABLE_SEMANTIC_MATCHING === 'true'
  
  if (!useSemanticMatching) {
    console.log('[profile_matcher:semantic] Feature flag disabled, falling back to string matching')
    return matchUserProfile(jobPosting)
  }
  
  try {
    console.log(`[profile_matcher:semantic] Starting semantic matching for job ${jobPosting.id}`)
    
    // 1. Generate embedding for job requirements
    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
    })
    
    const jobText = [
      ...jobPosting.core_requirements,
      ...jobPosting.technical_skills,
      ...jobPosting.responsibilities,
    ].join(' ')
    
    const jobEmbedding = await embeddings.embedQuery(jobText)
    
    // 2. Search portfolio chunks by semantic similarity
    const matchingChunks = await searchByEmbedding(jobEmbedding, 15, 0.3)
    
    console.log(`[profile_matcher:semantic] Found ${matchingChunks.length} matching chunks`)
    
    // 3. Extract and deduplicate projects from chunks
    const projectMap = new Map<string, {
      source_name: string
      role: string
      tech: string[]
      domain: string
      org: string
      similarity_score: number
      matching_skills: string[]
      matched_context: string
    }>()
    
    matchingChunks.forEach(chunk => {
      if (chunk.metadata?.source_type === 'case_study' || chunk.metadata?.source_type === 'experience') {
        const sourceName = chunk.metadata.source_name
        const existing = projectMap.get(sourceName)
        
        // Keep highest similarity score for each project
        if (!existing || chunk.score > existing.similarity_score) {
          projectMap.set(sourceName, {
            source_name: sourceName,
            role: chunk.metadata.role || '',
            tech: chunk.metadata.tech || [],
            domain: chunk.metadata.domain || '',
            org: chunk.metadata.org || '',
            similarity_score: chunk.score,
            matching_skills: [], // Populated below
            matched_context: chunk.text.slice(0, 200), // First 200 chars
          })
        }
      }
    })
    
    // 4. Compute skill overlap (hybrid: semantic + string matching)
    const jobSkills = new Set([
      ...jobPosting.technical_skills.map(s => s.toLowerCase()),
      ...jobPosting.soft_skills.map(s => s.toLowerCase()),
    ])
    
    const projects = Array.from(projectMap.values())
      .map(p => {
        const docSkills = new Set(p.tech.map((s: string) => s.toLowerCase()))
        const matchingSkills = Array.from(jobSkills).filter(skill => docSkills.has(skill))
        return {
          ...p,
          matching_skills: matchingSkills,
        }
      })
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 5) // Top 5
    
    // 5. Skill overlap analysis (from all projects)
    const allUserSkills = new Set<string>()
    projects.forEach(p => {
      p.tech.forEach(skill => allUserSkills.add(skill.toLowerCase()))
    })
    
    const matching = Array.from(jobSkills).filter(skill => allUserSkills.has(skill))
    const missing = Array.from(jobSkills).filter(skill => !allUserSkills.has(skill))
    const additional = Array.from(allUserSkills).filter(skill => !jobSkills.has(skill))
    
    const duration = Date.now() - startTime
    console.log(`[profile_matcher:semantic] Completed in ${duration}ms, found ${projects.length} projects`)
    
    // Log performance metrics
    if (duration > 500) {
      console.warn(`[profile_matcher:semantic] Slow performance: ${duration}ms (threshold: 500ms)`)
    }
    
    return {
      matching_projects: projects as any, // Type assertion for matched_context
      skill_overlap: {
        technical: matching,
        missing: missing,
        additional: additional.slice(0, 10),
      },
      domain_match: projects.some(p => jobPosting.domain_knowledge.includes(p.domain)),
      experience_level_match: projects.length >= 3, // Semantic found enough relevant projects
    }
    
  } catch (error) {
    console.error('[profile_matcher:semantic] Error in semantic matching, falling back to string matching:', error)
    return matchUserProfile(jobPosting)
  }
}