-- Create suggestion_cache table for Step 5
-- Caches generated suggestions to avoid repeated LLM calls

CREATE TABLE IF NOT EXISTS public.suggestion_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  cache_key TEXT UNIQUE NOT NULL,
  brand_slug TEXT NOT NULL,
  context_hash TEXT NOT NULL,
  
  suggestions JSONB NOT NULL,
  model TEXT NOT NULL,
  
  generated_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_suggestion_cache_brand ON public.suggestion_cache(brand_slug);
CREATE INDEX idx_suggestion_cache_expires ON public.suggestion_cache(expires_at);
CREATE INDEX idx_suggestion_cache_key ON public.suggestion_cache(cache_key);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_suggestion_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suggestion_cache_updated_at
  BEFORE UPDATE ON public.suggestion_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_suggestion_cache_updated_at();

-- RLS policies
ALTER TABLE suggestion_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to non-expired cache"
  ON suggestion_cache
  FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Allow service role full access"
  ON suggestion_cache
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

GRANT SELECT ON suggestion_cache TO anon, authenticated;
GRANT ALL ON suggestion_cache TO service_role;