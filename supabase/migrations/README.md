# Supabase Migrations

This directory contains SQL migration files for the Supabase database.

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended for Production)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file
4. Paste and run the SQL

### Option 2: Supabase CLI (Local Development)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push
```

### Option 3: Manual SQL Execution

```bash
# Connect to your database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migration
\i supabase/migrations/20250129_create_job_postings_table.sql
```

## Migrations

### 20250129_create_job_postings_table.sql

**Purpose**: Create `job_postings` table for Job Posting Intelligence feature

**What it does**:
- Enables `pgvector` extension for embeddings
- Creates `job_postings` table with all required fields
- Creates indexes for performance (brand_slug, is_active, embeddings)
- Creates HNSW indexes for fast vector similarity search
- Creates helper functions for semantic search
- Sets up Row Level Security (RLS) policies
- Grants appropriate permissions

**Requirements**:
- PostgreSQL 12+
- `pgvector` extension (should be available in Supabase by default)

**Safe to run**:
- ✅ Uses `IF NOT EXISTS` - won't fail if already exists
- ✅ Doesn't modify existing tables
- ✅ Can be rolled back by dropping the table

## Rollback

To rollback this migration:

```sql
-- Drop the table and all related objects
DROP TABLE IF EXISTS job_postings CASCADE;

-- Drop the functions
DROP FUNCTION IF EXISTS search_job_postings_by_embedding CASCADE;
DROP FUNCTION IF EXISTS search_job_postings_by_skills CASCADE;
DROP FUNCTION IF EXISTS update_job_postings_updated_at CASCADE;
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'job_postings'
);

-- Check if pgvector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'job_postings';

-- Test semantic search function
SELECT * FROM search_job_postings_by_embedding(
  array_fill(0.0, ARRAY[1536])::vector,
  0.5,
  10,
  NULL
);
```
