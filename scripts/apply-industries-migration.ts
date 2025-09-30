#!/usr/bin/env tsx
// Apply industries table migration - Task 1.7
// Applies migration to Supabase database with validation

import { config } from 'dotenv'
import { resolve } from 'path'
import { promises as fs } from 'fs'
import path from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createClient } from '@supabase/supabase-js'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'

async function applyMigration() {
  console.log(`${BLUE}📦 Industries Table Migration${RESET}`)
  console.log('='.repeat(60))
  console.log()
  
  // Check environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceKey) {
    console.error(`${RED}✗ ERROR:${RESET} Missing Supabase credentials`)
    console.error('  Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  })
  
  try {
    // Step 1: Check if table already exists
    console.log(`${BLUE}[1/5]${RESET} Checking if industries table exists...`)
    const { data: existing, error: checkError } = await supabase
      .from('industries')
      .select('count')
      .limit(0)
    
    if (!checkError) {
      console.log(`${YELLOW}⚠ WARNING:${RESET} Industries table already exists`)
      console.log('  Migration may have already been applied.')
      console.log('  To proceed anyway, continue. To abort, press Ctrl+C.')
    } else {
      console.log(`${GREEN}✓ PASS:${RESET} Table does not exist, safe to create`)
    }
    console.log()
    
    // Step 2: Read migration file
    console.log(`${BLUE}[2/5]${RESET} Reading migration file...`)
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20250930_create_industries_table.sql'
    )
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8')
    console.log(`${GREEN}✓ PASS:${RESET} Read ${migrationSQL.length} characters`)
    console.log()
    
    // Step 3: Apply migration
    console.log(`${BLUE}[3/5]${RESET} Applying migration...`)
    console.log('  This may take a few seconds...')
    
    // Note: Supabase client doesn't support raw SQL execution
    // You need to use SQL Editor in Supabase Dashboard or supabase CLI
    console.log()
    console.log(`${YELLOW}⚠ MANUAL STEP REQUIRED:${RESET}`)
    console.log('  Supabase client library does not support raw SQL execution.')
    console.log('  Please apply the migration using one of these methods:')
    console.log()
    console.log('  Option 1: Supabase CLI (recommended)')
    console.log('    $ supabase migration up')
    console.log()
    console.log('  Option 2: Supabase Dashboard')
    console.log('    1. Go to SQL Editor in Supabase Dashboard')
    console.log('    2. Paste contents of: supabase/migrations/20250930_create_industries_table.sql')
    console.log('    3. Run the query')
    console.log()
    console.log('  Option 3: Direct psql connection')
    console.log('    $ psql $DATABASE_URL < supabase/migrations/20250930_create_industries_table.sql')
    console.log()
    
    // Step 4: Validation
    console.log(`${BLUE}[4/5]${RESET} Waiting for manual migration...`)
    console.log('  Press Enter after you\'ve applied the migration manually')
    
    // Wait for user confirmation
    await new Promise<void>(resolve => {
      process.stdin.once('data', () => resolve())
    })
    
    console.log()
    console.log(`${BLUE}[5/5]${RESET} Validating migration...`)
    
    // Check if table exists
    const { data: industries, error: validateError } = await supabase
      .from('industries')
      .select('slug, name, accent_color')
      .limit(5)
    
    if (validateError) {
      console.error(`${RED}✗ FAIL:${RESET} Table validation failed: ${validateError.message}`)
      process.exit(1)
    }
    
    console.log(`${GREEN}✓ PASS:${RESET} Industries table exists`)
    console.log(`${GREEN}✓ PASS:${RESET} Found ${industries?.length || 0} industries`)
    
    if (industries && industries.length > 0) {
      console.log()
      console.log('Sample industries:')
      industries.forEach(i => {
        console.log(`  - ${i.name} (${i.slug}) - ${i.accent_color}`)
      })
    }
    
    // Success summary
    console.log()
    console.log('='.repeat(60))
    console.log(`${GREEN}✓ MIGRATION COMPLETE${RESET}`)
    console.log('='.repeat(60))
    console.log()
    console.log('Next steps:')
    console.log('  1. Update industry-manager.ts to use database instead of JSON')
    console.log('  2. Test industry creation flow')
    console.log('  3. Apply migration to staging/production')
    console.log()
    
  } catch (error: any) {
    console.error()
    console.error(`${RED}✗ ERROR:${RESET}`, error.message)
    console.error()
    process.exit(1)
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
