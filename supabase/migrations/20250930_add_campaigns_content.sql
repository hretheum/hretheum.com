-- Add content column to campaigns table for storing MDX content
-- This enables serverless deployment (Vercel) where filesystem is read-only

BEGIN;

-- Add content column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='content'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN content text;
  END IF;
END$$;

-- Add metadata columns for better campaign management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='industry'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN industry text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='role'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN role text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='location'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN location text;
  END IF;
END$$;

COMMIT;
