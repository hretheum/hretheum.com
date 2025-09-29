// Suggestion Prompt Builder - Step 2
// Build LLM prompt from job posting data with personalization support

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
    technical: string[]
    missing: string[]
    additional: string[]
  }
  domain_match: boolean
  experience_level_match: boolean
}

export interface SuggestionContext {
  brand_slug: string
  job_postings: JobPostingData[]
  industry?: string
  previous_questions?: string[]
  user_profile_match?: UserProfileMatch
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
  const personalizationSection = context.user_profile_match 
    ? buildPersonalizationSection(context.user_profile_match) 
    : ''
  
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
${context.user_profile_match ? '- LEVERAGE USER\'S PORTFOLIO: Reference their matching projects and skills' : ''}
${context.user_profile_match?.skill_overlap.missing.length ? '- ADDRESS SKILL GAPS: Help user prepare for skills they need to develop' : ''}
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