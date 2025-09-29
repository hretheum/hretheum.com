// Full Pipeline Test - Step 9 E2E Verification
import { config } from 'dotenv'
import path from 'path'
import { readJobPostingFile } from '../lib/job_postings/file_reader'
import { normalizeContent } from '../lib/job_postings/normalizer'
import { extractFileMetadata } from '../lib/job_postings/metadata'
import { extractSemanticData } from '../lib/job_postings/extractor'
import { generateEmbeddings } from '../lib/job_postings/embeddings'
import { storeJobPosting } from '../lib/job_postings/storage'
import { invalidateBrandCache } from '../lib/job_postings/cache'

// Load env files
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

async function testFullPipeline() {
  console.log('🧪 Full E2E Pipeline Test - Step 9\n')
  console.log('━'.repeat(60))
  
  const testFile = 'data/job_postings/e2e-test/e2e-test-20250129T231100Z.md'
  const filePath = path.join(process.cwd(), testFile)
  
  try {
    console.log(`\n📁 Processing: ${testFile}\n`)
    
    // Step 4: Extract metadata
    console.log('📋 Step 4: Extracting metadata...')
    const metadata = extractFileMetadata(path.basename(testFile))
    if (!metadata.valid) {
      console.error(`❌ Invalid metadata: ${metadata.error}`)
      return
    }
    console.log(`   ✓ Brand: ${metadata.brand_slug}`)
    console.log(`   ✓ Timestamp: ${metadata.timestamp.toISOString()}`)
    console.log(`   ✓ Format: ${metadata.format}`)
    
    // Step 2: Read file
    console.log('\n📖 Step 2: Reading file...')
    const content = await readJobPostingFile(filePath)
    console.log(`   ✓ Read ${content.length} characters`)
    
    // Step 3: Normalize
    console.log('\n📝 Step 3: Normalizing content...')
    const normalized = normalizeContent(content)
    console.log(`   ✓ Original: ${normalized.stats.originalLength} chars`)
    console.log(`   ✓ Normalized: ${normalized.stats.normalizedLength} chars`)
    console.log(`   ✓ Line breaks: ${normalized.lineBreaks}`)
    
    // Step 5b: Extract semantic data (using mock for speed)
    console.log('\n🧠 Step 5b: Extracting semantic data (mock)...')
    const extracted = await extractSemanticData(normalized.normalized, true)
    console.log(`   ✓ Technical skills: ${extracted.technical_skills.length}`)
    console.log(`   ✓ Soft skills: ${extracted.soft_skills.length}`)
    console.log(`   ✓ Seniority: ${extracted.seniority_level}`)
    console.log(`   ✓ Role type: ${extracted.role_type}`)
    
    // Step 6b: Generate embeddings (using mock for speed)
    console.log('\n🔢 Step 6b: Generating embeddings (mock)...')
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
    console.log(`   ✓ Dimensions: ${embeddings.dimensions}`)
    console.log(`   ✓ Model: ${embeddings.model}`)
    console.log(`   ✓ Full text embedding: ${embeddings.full_text.length} values`)
    
    // Step 7: Store in database
    console.log('\n💾 Step 7: Storing in database...')
    const result = await storeJobPosting(metadata, normalized, extracted, embeddings)
    
    if (!result.success) {
      console.error(`   ❌ Storage failed: ${result.error}`)
      return
    }
    
    console.log(`   ✓ Stored successfully!`)
    console.log(`   ✓ ID: ${result.id}`)
    
    // Step 8: Invalidate cache
    console.log('\n🔄 Step 8: Invalidating cache...')
    await invalidateBrandCache(metadata.brand_slug)
    console.log(`   ✓ Cache invalidated for brand: ${metadata.brand_slug}`)
    
    console.log('\n' + '━'.repeat(60))
    console.log('✅ FULL PIPELINE TEST PASSED!')
    console.log('━'.repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   Brand: ${metadata.brand_slug}`)
    console.log(`   Job Posting ID: ${result.id}`)
    console.log(`   Technical Skills: ${extracted.technical_skills.join(', ')}`)
    console.log(`   Seniority: ${extracted.seniority_level}`)
    console.log(`   Embeddings: ${embeddings.dimensions}D (${embeddings.model})`)
    console.log(`\n✨ All 8 steps completed successfully!`)
    
  } catch (error: any) {
    console.error('\n❌ Pipeline test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

testFullPipeline()
