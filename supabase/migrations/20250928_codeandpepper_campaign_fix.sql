-- Defensive fix: align brand_industries/campaigns schema and upsert records
-- Handles cases where brand_industries exists with different column names (e.g., brand instead of slug)

begin;

-- Ensure brand_industries table and required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brand_industries'
  ) THEN
    CREATE TABLE public.brand_industries (
      slug text PRIMARY KEY,
      industry text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;

  -- Ensure slug column exists; if there's a 'brand' column, rename it to slug
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='brand_industries' AND column_name='slug'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='brand_industries' AND column_name='brand'
    ) THEN
      EXECUTE 'ALTER TABLE public.brand_industries RENAME COLUMN brand TO slug';
    ELSE
      EXECUTE 'ALTER TABLE public.brand_industries ADD COLUMN slug text';
    END IF;
  END IF;

  -- Ensure industry column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='brand_industries' AND column_name='industry'
  ) THEN
    EXECUTE 'ALTER TABLE public.brand_industries ADD COLUMN industry text';
  END IF;

  -- Ensure primary key on slug
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.brand_industries'::regclass AND contype='p'
  ) THEN
    EXECUTE 'ALTER TABLE public.brand_industries ADD PRIMARY KEY (slug)';
  END IF;
END$$;

-- Upsert mapping for codeandpepper
INSERT INTO public.brand_industries (slug, industry)
VALUES ('codeandpepper','DigitalTech')
ON CONFLICT (slug) DO UPDATE SET industry = EXCLUDED.industry;

-- Ensure campaigns table and required columns (no FK to avoid failures on legacy schemas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'campaigns'
  ) THEN
    CREATE TABLE public.campaigns (
      brand_slug text PRIMARY KEY,
      mdx_slug text NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='brand_slug'
  ) THEN
    EXECUTE 'ALTER TABLE public.campaigns ADD COLUMN brand_slug text';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='mdx_slug'
  ) THEN
    EXECUTE 'ALTER TABLE public.campaigns ADD COLUMN mdx_slug text NOT NULL DEFAULT '''''';';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='active'
  ) THEN
    EXECUTE 'ALTER TABLE public.campaigns ADD COLUMN active boolean NOT NULL DEFAULT true';
  END IF;

  -- Ensure primary key exists on brand_slug
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.campaigns'::regclass AND contype='p'
  ) THEN
    EXECUTE 'ALTER TABLE public.campaigns ADD PRIMARY KEY (brand_slug)';
  END IF;
END$$;

-- Upsert campaign record
INSERT INTO public.campaigns (brand_slug, mdx_slug, active)
VALUES ('codeandpepper','codeandpepper_digital_designer', true)
ON CONFLICT (brand_slug) DO UPDATE SET mdx_slug = EXCLUDED.mdx_slug, active = EXCLUDED.active, updated_at = now();

commit;
