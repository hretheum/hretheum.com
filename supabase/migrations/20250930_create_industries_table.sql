-- Task 1.7: Create industries master table
-- Master list of all available industries for campaign creation
-- This is the source of truth for what industries can be used in campaigns

-- Create industries table
CREATE TABLE IF NOT EXISTS public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Core fields
  name TEXT NOT NULL UNIQUE,  -- Display name (e.g., "Health Care")
  slug TEXT NOT NULL UNIQUE,  -- URL-safe slug (e.g., "health-care")
  
  -- Visual customization
  accent_color TEXT NOT NULL DEFAULT '#6366f1',  -- Hex color for brand theming
  
  -- Metadata
  description TEXT,  -- Optional description of the industry
  icon TEXT,  -- Optional icon identifier
  
  -- Admin tracking
  created_by TEXT,  -- Admin email who created
  is_active BOOLEAN NOT NULL DEFAULT true,  -- Can be disabled without deleting
  
  -- Audit
  metadata JSONB  -- Additional flexible data
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS industries_slug_idx ON public.industries (slug);
CREATE INDEX IF NOT EXISTS industries_name_idx ON public.industries (name);
CREATE INDEX IF NOT EXISTS industries_active_idx ON public.industries (is_active);
CREATE INDEX IF NOT EXISTS industries_created_at_idx ON public.industries (created_at DESC);

-- Constraints
ALTER TABLE public.industries
  ADD CONSTRAINT industries_name_length CHECK (length(name) >= 3 AND length(name) <= 50);

ALTER TABLE public.industries
  ADD CONSTRAINT industries_slug_format CHECK (slug ~ '^[a-z0-9-]+$');

ALTER TABLE public.industries
  ADD CONSTRAINT industries_accent_color_format CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_industries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER industries_updated_at_trigger
  BEFORE UPDATE ON public.industries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_industries_updated_at();

-- RLS: Enable Row Level Security
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read access (anyone can view active industries)
CREATE POLICY industries_read_policy ON public.industries
  FOR SELECT
  USING (is_active = true);

-- Policy 2: Admin-only write access (insert/update/delete)
-- Requires service role or admin authentication
CREATE POLICY industries_admin_write_policy ON public.industries
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'email' IN (
      'eof@offline.pl'  -- Admin email
    )
  );

-- Insert default industries from brand_industries.json
-- This ensures backward compatibility
INSERT INTO public.industries (name, slug, accent_color, created_by, description) VALUES
  ('SaaS', 'saas', '#6366f1', 'system', 'Software as a Service companies'),
  ('Pharma', 'pharma', '#8b5cf6', 'system', 'Pharmaceutical and healthcare'),
  ('FinTech', 'fintech', '#ec4899', 'system', 'Financial technology'),
  ('Commerce', 'commerce', '#f59e0b', 'system', 'E-commerce and retail'),
  ('Manufacturing', 'manufacturing', '#10b981', 'system', 'Manufacturing and industrial'),
  ('Public', 'public', '#3b82f6', 'system', 'Public sector and government'),
  ('eLearning', 'elearning', '#f97316', 'system', 'Education technology'),
  ('Telecom', 'telecom', '#06b6d4', 'system', 'Telecommunications'),
  ('Retail', 'retail', '#f59e0b', 'system', 'Retail and consumer'),
  ('DigitalTech', 'digitaltech', '#8b5cf6', 'system', 'Digital technology services'),
  ('iGaming', 'igaming', '#ec4899', 'system', 'Gaming and entertainment'),
  ('Generic', 'generic', '#6b7280', 'system', 'Generic/Other')
ON CONFLICT (slug) DO NOTHING;  -- Idempotent: safe to re-run

-- Grant permissions
GRANT SELECT ON public.industries TO anon, authenticated;
GRANT ALL ON public.industries TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.industries IS 'Master list of available industries for campaign creation';
COMMENT ON COLUMN public.industries.name IS 'Display name shown in UI';
COMMENT ON COLUMN public.industries.slug IS 'URL-safe identifier (kebab-case)';
COMMENT ON COLUMN public.industries.accent_color IS 'Hex color for brand theming';
COMMENT ON COLUMN public.industries.is_active IS 'Whether industry can be used for new campaigns';
