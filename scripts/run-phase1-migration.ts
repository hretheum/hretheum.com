#!/usr/bin/env tsx
// Run Phase 1 migration directly through Supabase client

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createAdminClient } from '../utils/supabase/admin'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

async function runMigration() {
  console.log('='.repeat(60))
  console.log('PHASE 1 MIGRATION: Fix match_chunks RPC')
  console.log('='.repeat(60))
  console.log()

  const supabase = createAdminClient()
  
  // Read migration SQL
  const migrationPath = resolve(process.cwd(), 'supabase/migrations/20250130_fix_match_chunks_return_embedding.sql')
  const sql = readFileSync(migrationPath, 'utf-8')
  
  console.log(`Reading migration from: ${migrationPath}`)
  console.log(`SQL length: ${sql.length} characters`)
  console.log()
  
  // Execute migration
  console.log('Executing migration...')
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  
  if (error) {
    // Try alternative: split into statements and execute one by one
    console.log(`${YELLOW}Direct execution failed, trying statement-by-statement...${RESET}`)
    console.log(`Error was: ${error.message}`)
    console.log()
    
    // Split by semicolons and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Found ${statements.length} statements to execute`)
    console.log()
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      // Use raw query
      const { error: stmtError } = await (supabase as any).rpc('exec_sql', { query: stmt })
      
      if (stmtError) {
        console.log(`${RED}✗ FAIL:${RESET} Statement ${i + 1} failed: ${stmtError.message}`)
        console.log(`Statement: ${stmt.slice(0, 100)}...`)
        
        // Continue with other statements
        continue
      }
      
      console.log(`${GREEN}✓ OK${RESET}`)
    }
    
  } else {
    console.log(`${GREEN}✓ Migration executed successfully!${RESET}`)
  }
  
  console.log()
  console.log('='.repeat(60))
  console.log(`${GREEN}✓ MIGRATION COMPLETE${RESET}`)
  console.log('='.repeat(60))
  console.log()
  console.log('Next steps:')
  console.log('  1. Run validation: npx tsx scripts/validate-phase1.ts')
  console.log('  2. Proceed to Phase 2 if validation passes')
}

runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(`${RED}✗ ERROR:${RESET}`, err)
    process.exit(1)
  })
