// Quick test script for real embedding generation
import { config } from 'dotenv'
import path from 'path'
import { generateEmbeddings } from '../lib/job_postings/embeddings'
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

## Responsibilities
- Lead design system initiatives
- Collaborate with engineering and product teams
`

async function testEmbeddings() {
  console.log('🧪 Testing Real Embedding Generation...\n')
  console.log(`API Key present: ${!!process.env.OPENAI_API_KEY}`)
  console.log(`AI Gateway Key present: ${!!process.env.AI_GATEWAY_API_KEY}`)
  console.log(`AI Model Embeddings: ${process.env.AI_MODEL_EMBEDDINGS || 'text-embedding-3-small'}\n`)
  
  try {
    // First extract semantic data (using mock for speed)
    console.log('📊 Extracting semantic data...')
    const extracted = await extractSemanticData(testJobPosting, true)
    console.log(`   ✓ Extracted ${extracted.technical_skills.length} technical skills`)
    console.log(`   ✓ Seniority: ${extracted.seniority_level}, Role: ${extracted.role_type}\n`)
    
    // Generate embeddings
    console.log('🔢 Generating embeddings...')
    const result = await generateEmbeddings(testJobPosting, extracted, false)
    
    console.log('✅ Embedding generation successful!\n')
    console.log('📊 Results:')
    console.log('━'.repeat(50))
    console.log(`Model: ${result.model}`)
    console.log(`Dimensions: ${result.dimensions}`)
    console.log(`\nFull Text Embedding:`)
    console.log(`  Length: ${result.full_text.length}`)
    console.log(`  Sample values: [${result.full_text.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`)
    console.log(`  Sum: ${result.full_text.reduce((a, b) => a + b, 0).toFixed(4)}`)
    
    console.log(`\nRequirements Embedding:`)
    console.log(`  Length: ${result.requirements.length}`)
    console.log(`  Sample values: [${result.requirements.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`)
    console.log(`  Sum: ${result.requirements.reduce((a, b) => a + b, 0).toFixed(4)}`)
    
    console.log(`\nSkills Embedding:`)
    console.log(`  Length: ${result.skills.length}`)
    console.log(`  Sample values: [${result.skills.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`)
    console.log(`  Sum: ${result.skills.reduce((a, b) => a + b, 0).toFixed(4)}`)
    console.log('━'.repeat(50))
    
  } catch (error: any) {
    console.error('❌ Embedding generation failed:', error.message)
    process.exit(1)
  }
}

testEmbeddings()
