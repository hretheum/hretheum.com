#!/usr/bin/env tsx
// End-to-End Verification for Workflow 3 - Step 8
// Verifies complete suggestion generation pipeline

import { config } from 'dotenv'
import path from 'path'

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

import { getJobPostingsForBrand } from '../lib/job_postings/queries'
import { matchUserProfile } from '../lib/job_postings/profile_matcher'
import { generateSuggestions } from '../lib/job_postings/suggestion_generator'
import { getCachedSuggestions, setCachedSuggestions, invalidateBrandSuggestionCache } from '../lib/job_postings/suggestion_cache'
import { hashContext } from '../lib/job_postings/prompt_builder'

async function verifyWorkflow3() {
  console.log('🚀 Workflow 3 E2E Verification\n')
  
  const testBrand = 'e2e-test'
  
  try {
    // Step 1: Verify job postings exist
    console.log('📋 Step 1: Checking job postings...')
    const jobPostings = await getJobPostingsForBrand(testBrand, 5)
    
    if (jobPostings.length === 0) {
      console.error('❌ No job postings found for brand:', testBrand)
      console.log('   Run Workflow 1 first to create job postings')
      process.exit(1)
    }
    
    console.log(`✅ Found ${jobPostings.length} job posting(s)`)
    console.log(`   Latest: ${jobPostings[0].title} (${jobPostings[0].seniority_level})`)
    console.log(`   Skills: ${jobPostings[0].technical_skills.slice(0, 3).join(', ')}`)
    
    // Step 2: Match user profile
    console.log('\n👤 Step 2: Matching user profile...')
    const profileMatch = await matchUserProfile(jobPostings[0])
    
    console.log(`✅ Profile matched`)
    console.log(`   Matching projects: ${profileMatch.matching_projects.length}`)
    console.log(`   Skills overlap: ${profileMatch.skill_overlap.technical.length} matching, ${profileMatch.skill_overlap.missing.length} missing`)
    
    if (profileMatch.matching_projects.length > 0) {
      console.log(`   Top project: ${profileMatch.matching_projects[0].source_name} (${Math.round(profileMatch.matching_projects[0].similarity_score * 100)}% match)`)
    }
    
    // Step 3: Clear cache
    console.log('\n🗑️  Step 3: Clearing cache...')
    await invalidateBrandSuggestionCache(testBrand)
    console.log('✅ Cache cleared')
    
    // Step 4: Generate suggestions
    console.log('\n🤖 Step 4: Generating suggestions...')
    const context = {
      brand_slug: testBrand,
      job_postings: jobPostings,
      user_profile_match: profileMatch,
    }
    
    const generated = await generateSuggestions(context)
    
    console.log(`✅ Generated ${generated.suggestions.length} suggestions`)
    console.log('   Suggestions:')
    generated.suggestions.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s}`)
    })
    
    // Step 5: Cache suggestions
    console.log('\n💾 Step 5: Caching suggestions...')
    await setCachedSuggestions(testBrand, generated, 24)
    console.log('✅ Suggestions cached (TTL: 24h)')
    
    // Step 6: Verify cache retrieval
    console.log('\n🔍 Step 6: Verifying cache retrieval...')
    const contextHash = hashContext(context)
    const cached = await getCachedSuggestions(testBrand, contextHash)
    
    if (!cached) {
      console.error('❌ Failed to retrieve cached suggestions')
      process.exit(1)
    }
    
    console.log('✅ Cache retrieval successful')
    console.log(`   Hit count: ${cached.hit_count}`)
    console.log(`   Expires: ${cached.expires_at.toISOString()}`)
    
    // Step 7: Verify suggestions match
    console.log('\n✔️  Step 7: Verifying suggestions match...')
    const match = JSON.stringify(cached.suggestions) === JSON.stringify(generated.suggestions)
    
    if (!match) {
      console.error('❌ Cached suggestions do not match generated')
      process.exit(1)
    }
    
    console.log('✅ Suggestions match perfectly')
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 WORKFLOW 3 E2E VERIFICATION PASSED!')
    console.log('='.repeat(60))
    console.log('\n📊 Summary:')
    console.log(`   Brand: ${testBrand}`)
    console.log(`   Job Postings: ${jobPostings.length}`)
    console.log(`   Matching Projects: ${profileMatch.matching_projects.length}`)
    console.log(`   Suggestions Generated: ${generated.suggestions.length}`)
    console.log(`   Cache Working: ✅`)
    console.log(`   Personalization: ${profileMatch.matching_projects.length > 0 ? '✅' : '⚠️  (no matching projects)'}`)
    console.log('\n✨ All steps completed successfully!')
    console.log('\nNext: Test in browser at http://localhost:3000/brand/' + testBrand)
    
  } catch (error: any) {
    console.error('\n❌ E2E Verification Failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

verifyWorkflow3()