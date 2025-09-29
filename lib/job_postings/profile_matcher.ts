// User Profile Matcher - Step 3
// Match job posting requirements with user's portfolio/experience

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