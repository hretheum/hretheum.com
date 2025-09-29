// Quick test script for LLM extraction with real API
import { config } from 'dotenv'
import path from 'path'
import { extractSemanticData } from '../lib/job_postings/extractor'

// Load .env.local
config({ path: path.join(process.cwd(), '.env.local') })

const testJobPosting = `
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

async function testExtraction() {
  console.log('🧪 Testing LLM Semantic Extraction...\n')
  console.log(`API Key present: ${!!process.env.OPENAI_API_KEY}`)
  console.log(`AI Gateway Key present: ${!!process.env.AI_GATEWAY_API_KEY}`)
  console.log(`AI Gateway URL: ${process.env.AI_GATEWAY_URL}\n`)
  
  try {
    const result = await extractSemanticData(testJobPosting, false)
    
    console.log('✅ Extraction successful!\n')
    console.log('📊 Results:')
    console.log('━'.repeat(50))
    console.log(`Core Requirements (${result.core_requirements.length}):`)
    result.core_requirements.forEach(req => console.log(`  • ${req}`))
    
    console.log(`\nTechnical Skills (${result.technical_skills.length}):`)
    result.technical_skills.forEach(skill => console.log(`  • ${skill}`))
    
    console.log(`\nSoft Skills (${result.soft_skills.length}):`)
    result.soft_skills.forEach(skill => console.log(`  • ${skill}`))
    
    console.log(`\nDomain Knowledge (${result.domain_knowledge.length}):`)
    result.domain_knowledge.forEach(domain => console.log(`  • ${domain}`))
    
    console.log(`\nCulture Signals (${result.culture_signals.length}):`)
    result.culture_signals.forEach(signal => console.log(`  • ${signal}`))
    
    console.log(`\nResponsibilities (${result.responsibilities.length}):`)
    result.responsibilities.forEach(resp => console.log(`  • ${resp}`))
    
    console.log(`\nSeniority Level: ${result.seniority_level}`)
    console.log(`Role Type: ${result.role_type}`)
    console.log('━'.repeat(50))
    
  } catch (error: any) {
    console.error('❌ Extraction failed:', error.message)
    process.exit(1)
  }
}

testExtraction()
