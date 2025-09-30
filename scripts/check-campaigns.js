#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCampaigns() {
  console.log('Checking campaigns table...\n')
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${data.length} campaigns:\n`)
  data.forEach(campaign => {
    console.log(`- ${campaign.brand_slug} → ${campaign.mdx_slug}`)
    console.log(`  Industry: ${campaign.industry || 'N/A'}`)
    console.log(`  Role: ${campaign.role || 'N/A'}`)
    console.log(`  Content length: ${campaign.content?.length || 0} chars`)
    console.log(`  Created: ${campaign.created_at}`)
    console.log(`  Active: ${campaign.active}`)
    console.log('')
  })
}

checkCampaigns()
