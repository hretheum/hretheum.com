// E2E Verification Script - Step 9
import { config } from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load env files
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

async function verifyE2E() {
  console.log('🔍 E2E Verification - Step 9\n')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    // Check for e2e-test brand job postings
    console.log('📊 Checking database for e2e-test job postings...')
    const { data, error } = await supabase
      .from('job_postings')
      .select('id, brand_slug, title, created_at, technical_skills, seniority_level, embedding_model')
      .eq('brand_slug', 'e2e-test')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('❌ Database query failed:', error.message)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  No job postings found for brand: e2e-test')
      console.log('   This is expected if watcher hasn\'t processed files yet.')
      return
    }
    
    console.log(`✅ Found ${data.length} job posting(s) for e2e-test:\n`)
    
    data.forEach((posting, index) => {
      console.log(`${index + 1}. ${posting.title || 'Untitled'}`)
      console.log(`   ID: ${posting.id}`)
      console.log(`   Created: ${new Date(posting.created_at).toLocaleString()}`)
      console.log(`   Technical Skills: ${posting.technical_skills?.length || 0}`)
      console.log(`   Seniority: ${posting.seniority_level || 'unknown'}`)
      console.log(`   Embedding Model: ${posting.embedding_model || 'N/A'}`)
      console.log('')
    })
    
    // Check total count
    const { count } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📈 Total job postings in database: ${count}`)
    
    // Check brands
    const { data: brands } = await supabase
      .from('job_postings')
      .select('brand_slug')
      .order('brand_slug')
    
    const uniqueBrands = [...new Set(brands?.map(b => b.brand_slug) || [])]
    console.log(`🏢 Brands with job postings: ${uniqueBrands.join(', ')}`)
    
    console.log('\n✅ E2E Verification Complete!')
    
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyE2E()
