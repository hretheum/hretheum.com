-- Phase 2.A: Campaign Schema Migration
-- Refactor campaigns table for Phase 2.A architecture (no online editor)
-- Changes: active → visible, add missing fields, RLS policies, indexes

BEGIN;

-- 1. Add new columns if they don't exist
DO $$
BEGIN
  -- Add visible column (Phase 2.A: replaces 'active')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='visible'
  ) THEN
    -- First add the column as nullable
    ALTER TABLE public.campaigns ADD COLUMN visible boolean;
    -- Copy data from active if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='campaigns' AND column_name='active'
    ) THEN
      UPDATE public.campaigns SET visible = active;
    END IF;
    -- Now set default and not null
    ALTER TABLE public.campaigns ALTER COLUMN visible SET DEFAULT true;
    ALTER TABLE public.campaigns ALTER COLUMN visible SET NOT NULL;
  END IF;

  -- Add campaign_file column (stores MDX filename)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='campaign_file'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN campaign_file text;
    -- Populate from mdx_slug if exists
    UPDATE public.campaigns SET campaign_file = mdx_slug || '.mdx' WHERE mdx_slug IS NOT NULL;
  END IF;

  -- Add job_posting_id column (link to job_postings table)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='job_posting_id'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN job_posting_id uuid REFERENCES job_postings(id);
  END IF;

  -- Add created_by column (admin email who created campaign)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='created_by'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN created_by text;
  END IF;

  -- Add id column (UUID primary key - will replace brand_slug as PK later)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='id'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN id uuid DEFAULT gen_random_uuid();
    -- Populate existing rows with UUIDs
    UPDATE public.campaigns SET id = gen_random_uuid() WHERE id IS NULL;
    -- Add NOT NULL constraint
    ALTER TABLE public.campaigns ALTER COLUMN id SET NOT NULL;
  END IF;

  -- Add slug column (canonical campaign slug - will be unique)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='slug'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN slug text;
    -- Populate from mdx_slug if exists
    UPDATE public.campaigns SET slug = mdx_slug WHERE mdx_slug IS NOT NULL;
  END IF;

END$$;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_slug ON public.campaigns(brand_slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_visible ON public.campaigns(visible);
CREATE INDEX IF NOT EXISTS idx_campaigns_industry ON public.campaigns(industry);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at);

-- 3. Add unique constraint on slug (after data is populated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campaigns_slug_unique'
  ) THEN
    -- Only add if slug column has no nulls
    IF NOT EXISTS (SELECT 1 FROM public.campaigns WHERE slug IS NULL) THEN
      ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_slug_unique UNIQUE (slug);
    END IF;
  END IF;
END$$;

-- 4. Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Public read visible campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins full access" ON public.campaigns;
DROP POLICY IF EXISTS "Public read active campaigns" ON public.campaigns;

-- 6. Create RLS Policies

-- Policy 1: Public can read visible campaigns
CREATE POLICY "Public read visible campaigns" 
ON public.campaigns 
FOR SELECT 
USING (visible = true);

-- Policy 2: Admins have full access (read, insert, update, delete)
-- Note: Admin authorization is enforced at the application level (API endpoints)
-- This policy allows authenticated users to manage campaigns
-- The actual ADMIN_EMAILS check happens in Next.js API routes
CREATE POLICY "Admins full access" 
ON public.campaigns 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 7. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at_trigger ON public.campaigns;

CREATE TRIGGER campaigns_updated_at_trigger
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.campaigns_updated_at();

-- 8. Backfill campaigns from index.json
-- Insert campaigns that don't exist yet
-- This is a manual step - run after migration if needed

COMMENT ON TABLE public.campaigns IS 'Campaign metadata for Phase 2.A architecture. MDX files stored locally, metadata in DB.';
COMMENT ON COLUMN public.campaigns.visible IS 'Phase 2.A: Campaign visibility toggle (replaces active). When false, campaign is hidden from public.';
COMMENT ON COLUMN public.campaigns.campaign_file IS 'MDX filename in data/campaigns/ directory';
COMMENT ON COLUMN public.campaigns.job_posting_id IS 'Link to job_postings table (optional)';
COMMENT ON COLUMN public.campaigns.created_by IS 'Email of admin who created the campaign';

COMMIT;
