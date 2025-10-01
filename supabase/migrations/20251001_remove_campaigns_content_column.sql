-- Remove content column from campaigns table
-- Phase 2.A: MDX files are source of truth, not database

BEGIN;

-- Drop content column if it exists (non-destructive)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='content'
  ) THEN
    ALTER TABLE public.campaigns DROP COLUMN content;
    RAISE NOTICE 'Dropped content column from campaigns table';
  ELSE
    RAISE NOTICE 'Content column does not exist, skipping';
  END IF;
END$$;

COMMENT ON TABLE public.campaigns IS 'Campaign metadata only. Content stored in MDX files (data/campaigns/*.mdx). Phase 2.A architecture.';

COMMIT;
