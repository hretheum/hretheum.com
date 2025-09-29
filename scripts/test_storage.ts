// Quick test script for database storage
import { config } from 'dotenv'
import path from 'path'
import { storeJobPosting } from '../lib/job_postings/storage'
import { extractFileMetadata } from '../lib/job_postings/metadata'
import { normalizeContent } from '../lib/job_postings/normalizer'
import { extractSemanticData } from '../lib/job_postings/extractor'
import { generateEmbeddings } from '../lib/job_postings/embeddings'

// Load .env files
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

const testJobPosting = `
# Senior Product Designer - Test Company

## Requirements
- 5+ years of product design experience
- Strong portfolio demonstrating end-to-end design process
- Experience with React, TypeScript, and Figma
- Excellent communication skills

## Responsibilities
- Lead design system initiatives
- Collaborate with engineering and product teams
`

async function testStorage() {
  console.log('🧪 Testing Database Storage...\n')
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`Service Role Key present: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}\n`)
  
  try {
    // Step 1: Extract metadata
    console.log('📋 Step 1: Extracting metadata...')
    const metadata = extractFileMetadata('test-company-20250129T230500Z.md')
    console.log(`   ✓ Brand: ${metadata.brand_slug}`)
    console.log(`   ✓ Format: ${metadata.format}\n`)
    
    // Step 2: Normalize content
    console.log('📝 Step 2: Normalizing content...')
    const normalized = normalizeContent(testJobPosting)
    console.log(`   ✓ Original: ${normalized.stats.originalLength} chars`)
    console.log(`   ✓ Normalized: ${normalized.stats.normalizedLength} chars\n`)
    
    // Step 3: Extract semantic data (using mock for speed)
    console.log('🧠 Step 3: Extracting semantic data (mock)...')
    const extracted = await extractSemanticData(normalized.normalized, true)
    console.log(`   ✓ Technical skills: ${extracted.technical_skills.length}`)
    console.log(`   ✓ Seniority: ${extracted.seniority_level}\n`)
    
    // Step 4: Generate embeddings (using mock for speed)
    console.log('🔢 Step 4: Generating embeddings (mock)...')
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
    console.log(`   ✓ Dimensions: ${embeddings.dimensions}`)
    console.log(`   ✓ Model: ${embeddings.model}\n`)
    
    // Step 5: Store in database
    console.log('💾 Step 5: Storing in database...')
    const result = await storeJobPosting(metadata, normalized, extracted, embeddings)
    
    if (result.success) {
      console.log('✅ Storage successful!\n')
      console.log('📊 Results:')
      console.log('━'.repeat(50))
      console.log(`ID: ${result.id}`)
      console.log(`Brand: ${metadata.brand_slug}`)
      console.log(`File: ${metadata.filename}`)
      console.log('━'.repeat(50))
    } else {
      console.error('❌ Storage failed!')
      console.error(`Error: ${result.error}`)
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testStorage()
