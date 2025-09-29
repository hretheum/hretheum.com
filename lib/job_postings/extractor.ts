// Job Posting Semantic Extractor - Step 5 (Mock)
// Extracts structured data using LLM (mock implementation for now)

export interface ExtractedData {
  core_requirements: string[]
  technical_skills: string[]
  soft_skills: string[]
  domain_knowledge: string[]
  culture_signals: string[]
  responsibilities: string[]
  seniority_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | 'unknown'
  role_type: 'ic' | 'manager' | 'hybrid' | 'unknown'
}

export async function extractSemanticData(
  content: string,
  useMock: boolean = true
): Promise<ExtractedData> {
  if (useMock) {
    // Mock extraction for testing
    console.log(`[extractor] Using MOCK extraction (${content.length} chars)`)
    
    return {
      core_requirements: ['5+ years experience', 'Portfolio required'],
      technical_skills: ['React', 'TypeScript', 'Figma'],
      soft_skills: ['Communication', 'Leadership'],
      domain_knowledge: ['FinTech', 'E-commerce'],
      culture_signals: ['Fast-paced', 'Collaborative'],
      responsibilities: ['Design systems', 'Stakeholder management'],
      seniority_level: 'senior',
      role_type: 'ic'
    }
  }
  
  // TODO: Step 5b - Real LLM extraction
  throw new Error('Real LLM extraction not implemented yet')
}
