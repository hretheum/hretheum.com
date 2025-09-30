#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// Quick migration script - execute one SQL file
async function runMigration() {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE env variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const sqlFile = path.join(__dirname, '../supabase/migrations/20250930_add_campaigns_content.sql')
  const sql = fs.readFileSync(sqlFile, 'utf-8')
  
  console.log('Running migration: 20250930_add_campaigns_content.sql')
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })
  
  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
  
  console.log('✅ Migration complete')
}

runMigration()
