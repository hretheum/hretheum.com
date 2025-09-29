// Job Posting Semantic Extractor - Steps 5 & 5b
// Extracts structured data using LLM (mock + real implementation)

import OpenAI from 'openai'

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

async function extractWithLLM(content: string): Promise<ExtractedData> {
  const openai = new OpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.AI_GATEWAY_API_KEY 
      ? process.env.AI_GATEWAY_URL
      : undefined,
  })

  const prompt = `Analyze this job posting and extract structured information.

JOB POSTING:
${content.slice(0, 4000)}

Extract the following (return STRICT JSON):
{
  "core_requirements": ["..."],
  "technical_skills": ["..."],
  "soft_skills": ["..."],
  "domain_knowledge": ["..."],
  "culture_signals": ["..."],
  "responsibilities": ["..."],
  "seniority_level": "entry|mid|senior|lead|executive|unknown",
  "role_type": "ic|manager|hybrid|unknown"
}

Rules:
- Be specific and concise (3-10 words per item)
- Extract only explicitly stated requirements
- Normalize skill names (e.g., "React.js" → "React")
- Max 15 items per array
- Return valid JSON only`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL_GENERATION || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You extract structured data from job postings. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const content_text = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content_text)
    
    return {
      core_requirements: parsed.core_requirements || [],
      technical_skills: parsed.technical_skills || [],
      soft_skills: parsed.soft_skills || [],
      domain_knowledge: parsed.domain_knowledge || [],
      culture_signals: parsed.culture_signals || [],
      responsibilities: parsed.responsibilities || [],
      seniority_level: parsed.seniority_level || 'unknown',
      role_type: parsed.role_type || 'unknown',
    }
  } catch (error: any) {
    console.error(`[extractor] LLM extraction failed: ${error.message}`)
    // Return empty structure on error
    return {
      core_requirements: [],
      technical_skills: [],
      soft_skills: [],
      domain_knowledge: [],
      culture_signals: [],
      responsibilities: [],
      seniority_level: 'unknown',
      role_type: 'unknown',
    }
  }
}

export async function extractSemanticData(
  content: string,
  useMock: boolean = false  // Changed default to false (use real LLM)
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
  
  console.log(`[extractor] Using REAL LLM extraction (${content.length} chars)`)
  return await extractWithLLM(content)
}
