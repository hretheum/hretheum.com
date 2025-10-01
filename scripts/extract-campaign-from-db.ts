/**
 * Extract campaign MDX from Supabase database
 * Usage: npx tsx scripts/extract-campaign-from-db.ts <slug>
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function extractCampaign(slug: string) {
  console.log(`\n🔍 Extracting campaign: ${slug}`)

  // Fetch from database
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('❌ Campaign not found:', error?.message)
    process.exit(1)
  }

  console.log('✅ Found campaign:', {
    brand_slug: data.brand_slug,
    slug: data.slug,
    industry: data.industry,
    visible: data.visible,
    contentLength: data.content?.length
  })

  if (!data.content) {
    console.error('❌ No content in database')
    process.exit(1)
  }

  // Save MDX file
  const campaignsDir = path.join(process.cwd(), 'data', 'campaigns')
  const mdxPath = path.join(campaignsDir, `${slug}.mdx`)

  fs.writeFileSync(mdxPath, data.content, 'utf-8')
  console.log(`✅ MDX file saved: ${mdxPath}`)

  // Update index.json
  const indexPath = path.join(campaignsDir, 'index.json')
  const indexContent = fs.readFileSync(indexPath, 'utf-8')
  const index = JSON.parse(indexContent)

  if (!index[data.brand_slug]) {
    index[data.brand_slug] = { slug: data.slug }
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf-8')
    console.log(`✅ index.json updated: ${data.brand_slug} -> ${data.slug}`)
  } else {
    console.log(`ℹ️  index.json already has entry for ${data.brand_slug}`)
  }

  console.log('\n🎉 Campaign extracted successfully!')
}

const slug = process.argv[2]

if (!slug) {
  console.error('Usage: npx tsx scripts/extract-campaign-from-db.ts <slug>')
  process.exit(1)
}

extractCampaign(slug).catch(err => {
  console.error('💥 Error:', err)
  process.exit(1)
})
