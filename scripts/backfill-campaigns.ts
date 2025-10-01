/**
 * Backfill campaigns table from index.json
 * 
 * Phase 2.A: Populate campaigns table with existing campaign data
 * 
 * Usage:
 *   npx tsx scripts/backfill-campaigns.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface IndexEntry {
  slug: string
}

interface CampaignFrontmatter {
  slug?: string
  brand?: string
  industry?: string
  role?: string
  location?: string
  [key: string]: any
}

async function main() {
  console.log('🚀 Starting campaigns backfill...\n')

  // 1. Read index.json
  const indexPath = path.join(process.cwd(), 'data/campaigns/index.json')
  const indexContent = fs.readFileSync(indexPath, 'utf-8')
  const index: Record<string, IndexEntry> = JSON.parse(indexContent)

  console.log(`📋 Found ${Object.keys(index).length} campaigns in index.json\n`)

  // 2. Process each campaign
  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const [brandSlug, entry] of Object.entries(index)) {
    try {
      const mdxSlug = entry.slug
      const campaignFile = `${mdxSlug}.mdx`
      const mdxPath = path.join(process.cwd(), 'data/campaigns', campaignFile)

      // Check if MDX file exists
      if (!fs.existsSync(mdxPath)) {
        console.log(`⚠️  ${brandSlug}: MDX file not found: ${campaignFile}`)
        skipCount++
        continue
      }

      // Read MDX file and extract frontmatter
      const mdxContent = fs.readFileSync(mdxPath, 'utf-8')
      const frontmatter = extractFrontmatter(mdxContent)

      // Check if campaign already exists
      const { data: existing } = await supabase
        .from('campaigns')
        .select('brand_slug')
        .eq('brand_slug', brandSlug)
        .single()

      if (existing) {
        console.log(`⏭️  ${brandSlug}: Already exists, skipping`)
        skipCount++
        continue
      }

      // Insert campaign
      const { error } = await supabase
        .from('campaigns')
        .insert({
          brand_slug: brandSlug,
          slug: mdxSlug,
          mdx_slug: mdxSlug,
          campaign_file: campaignFile,
          industry: frontmatter.industry || null,
          role: frontmatter.role || null,
          location: frontmatter.location || null,
          content: mdxContent,
          visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error(`❌ ${brandSlug}: Failed to insert:`, error.message)
        errorCount++
      } else {
        console.log(`✅ ${brandSlug}: Inserted successfully`)
        successCount++
      }

    } catch (err) {
      console.error(`❌ ${brandSlug}: Error processing:`, err)
      errorCount++
    }
  }

  // 3. Summary
  console.log('\n📊 Backfill Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ⏭️  Skipped: ${skipCount}`)
  console.log(`   ❌ Errors:  ${errorCount}`)
  console.log(`   📋 Total:   ${Object.keys(index).length}`)

  if (errorCount > 0) {
    console.log('\n⚠️  Some campaigns failed to backfill. Check errors above.')
    process.exit(1)
  } else {
    console.log('\n🎉 Backfill completed successfully!')
  }
}

function extractFrontmatter(mdxContent: string): CampaignFrontmatter {
  const match = mdxContent.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}

  const frontmatterStr = match[1]
  const frontmatter: CampaignFrontmatter = {}

  // Simple YAML parser for basic key: value pairs
  const lines = frontmatterStr.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.substring(0, colonIndex).trim()
    const value = line.substring(colonIndex + 1).trim()

    // Remove quotes
    const cleanValue = value.replace(/^["']|["']$/g, '')
    frontmatter[key] = cleanValue
  }

  return frontmatter
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
