-- Migration: Create job_postings table for Job Posting Intelligence feature
-- Date: 2025-01-29
-- Description: Stores processed job postings with embeddings for semantic search

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic metadata
  brand_slug TEXT NOT NULL,
  title TEXT,
  company TEXT,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- File metadata
  raw_content TEXT,
  normalized_content TEXT,
  file_path TEXT,
  file_format TEXT CHECK (file_format IN ('md', 'txt', 'json')),
  content_hash TEXT UNIQUE, -- For deduplication
  
  -- Extracted semantic data (JSONB for flexibility)
  core_requirements JSONB DEFAULT '[]'::jsonb,
  technical_skills JSONB DEFAULT '[]'::jsonb,
  soft_skills JSONB DEFAULT '[]'::jsonb,
  domain_knowledge JSONB DEFAULT '[]'::jsonb,
  culture_signals JSONB DEFAULT '[]'::jsonb,
  responsibilities JSONB DEFAULT '[]'::jsonb,
  seniority_level TEXT CHECK (seniority_level IN ('entry', 'mid', 'senior', 'lead', 'executive', 'unknown')),
  role_type TEXT CHECK (role_type IN ('ic', 'manager', 'hybrid', 'unknown')),
  
  -- Embeddings (1536 dimensions for text-embedding-3-small)
  embedding_full_text vector(1536),
  embedding_requirements vector(1536),
  embedding_skills vector(1536),
  embedding_model TEXT, -- Track which model was used
  
  -- Cache management
  cache_key TEXT,
  cache_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_postings_brand_slug ON job_postings(brand_slug);
CREATE INDEX IF NOT EXISTS idx_job_postings_is_active ON job_postings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_content_hash ON job_postings(content_hash);
CREATE INDEX IF NOT EXISTS idx_job_postings_cache_key ON job_postings(cache_key);

-- Create vector similarity search indexes (using HNSW for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_job_postings_embedding_full_text 
  ON job_postings USING hnsw (embedding_full_text vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_job_postings_embedding_requirements 
  ON job_postings USING hnsw (embedding_requirements vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_job_postings_embedding_skills 
  ON job_postings USING hnsw (embedding_skills vector_cosine_ops);

-- Create GIN indexes for JSONB fields (for fast JSON queries)
CREATE INDEX IF NOT EXISTS idx_job_postings_technical_skills 
  ON job_postings USING gin (technical_skills);

CREATE INDEX IF NOT EXISTS idx_job_postings_core_requirements 
  ON job_postings USING gin (core_requirements);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_postings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_job_postings_updated_at();

-- Create function for semantic search by full text
CREATE OR REPLACE FUNCTION search_job_postings_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_brand_slug text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  brand_slug text,
  title text,
  content text,
  technical_skills jsonb,
  seniority_level text,
  role_type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jp.id,
    jp.brand_slug,
    jp.title,
    jp.content,
    jp.technical_skills,
    jp.seniority_level,
    jp.role_type,
    1 - (jp.embedding_full_text <=> query_embedding) as similarity
  FROM job_postings jp
  WHERE jp.is_active = true
    AND (filter_brand_slug IS NULL OR jp.brand_slug = filter_brand_slug)
    AND 1 - (jp.embedding_full_text <=> query_embedding) > match_threshold
  ORDER BY jp.embedding_full_text <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function for semantic search by skills
CREATE OR REPLACE FUNCTION search_job_postings_by_skills(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_brand_slug text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  brand_slug text,
  title text,
  technical_skills jsonb,
  soft_skills jsonb,
  seniority_level text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jp.id,
    jp.brand_slug,
    jp.title,
    jp.technical_skills,
    jp.soft_skills,
    jp.seniority_level,
    1 - (jp.embedding_skills <=> query_embedding) as similarity
  FROM job_postings jp
  WHERE jp.is_active = true
    AND (filter_brand_slug IS NULL OR jp.brand_slug = filter_brand_slug)
    AND 1 - (jp.embedding_skills <=> query_embedding) > match_threshold
  ORDER BY jp.embedding_skills <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add Row Level Security (RLS) policies
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to active job postings
CREATE POLICY "Allow public read access to active job postings"
  ON job_postings
  FOR SELECT
  USING (is_active = true);

-- Policy: Allow service role full access (for backend operations)
CREATE POLICY "Allow service role full access"
  ON job_postings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE job_postings IS 'Stores processed job postings with semantic embeddings for intelligent matching';
COMMENT ON COLUMN job_postings.content_hash IS 'SHA-256 hash of normalized content for deduplication';
COMMENT ON COLUMN job_postings.embedding_full_text IS 'Vector embedding of full job posting text';
COMMENT ON COLUMN job_postings.embedding_requirements IS 'Vector embedding of core requirements';
COMMENT ON COLUMN job_postings.embedding_skills IS 'Vector embedding of technical and soft skills';
COMMENT ON COLUMN job_postings.cache_key IS 'Cache key for invalidating brand-specific caches';

-- Grant permissions
GRANT SELECT ON job_postings TO anon, authenticated;
GRANT ALL ON job_postings TO service_role;
