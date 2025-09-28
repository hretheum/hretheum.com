-- Final robust fix: align with existing schema and avoid ON CONFLICT.
-- Compatible with legacy installs missing PK/UNIQUE and older CHECK sets.

begin;

-- 1) Ensure public.brand_industries exists and conforms
create table if not exists public.brand_industries (
  brand_slug text primary key,
  industry text not null,
  status text not null default 'manual',
  updated_by text null,
  updated_at timestamptz not null default now(),
  note jsonb null
);

-- Ensure required columns exist / rename legacy columns
DO $$
BEGIN
  -- brand_slug
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='brand_industries' AND column_name='brand_slug'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='brand_industries' AND column_name='slug'
    ) THEN
      EXECUTE 'ALTER TABLE public.brand_industries RENAME COLUMN slug TO brand_slug';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='brand_industries' AND column_name='brand'
    ) THEN
      EXECUTE 'ALTER TABLE public.brand_industries RENAME COLUMN brand TO brand_slug';
    ELSE
      EXECUTE 'ALTER TABLE public.brand_industries ADD COLUMN brand_slug text';
    END IF;
  END IF;

  -- industry
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='brand_industries' AND column_name='industry'
  ) THEN
    EXECUTE 'ALTER TABLE public.brand_industries ADD COLUMN industry text';
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='brand_industries' AND column_name='status'
  ) THEN
    EXECUTE 'ALTER TABLE public.brand_industries ADD COLUMN status text NOT NULL DEFAULT ''manual''';
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='brand_industries' AND column_name='updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.brand_industries ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now()';
  END IF;
END$$;

-- Ensure PK on (brand_slug); if absent, add it
DO $$
DECLARE has_pk boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.brand_industries'::regclass AND contype='p'
  ) INTO has_pk;
  IF NOT has_pk THEN
    -- attempt to add PK; assumes unique brand_slug values
    EXECUTE 'ALTER TABLE public.brand_industries ADD PRIMARY KEY (brand_slug)';
  END IF;
END$$;

-- Replace any existing CHECK on industry with a version including DigitalTech etc.
DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname FROM pg_constraint
  WHERE conrelid = 'public.brand_industries'::regclass AND contype='c' LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.brand_industries DROP CONSTRAINT %I', cname);
  END IF;
  EXECUTE $$ALTER TABLE public.brand_industries
    ADD CONSTRAINT brand_industries_industry_check
    CHECK (industry IN ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Telecom','Retail','DigitalTech','Generic'))$$;
END$$;

-- Upsert mapping for codeandpepper without ON CONFLICT
UPDATE public.brand_industries
   SET industry='DigitalTech', status='manual', updated_at=now()
 WHERE brand_slug='codeandpepper';
INSERT INTO public.brand_industries (brand_slug, industry, status, updated_at)
SELECT 'codeandpepper','DigitalTech','manual', now()
WHERE NOT EXISTS (SELECT 1 FROM public.brand_industries WHERE brand_slug='codeandpepper');

-- 2) Ensure campaigns registry exists
create table if not exists public.campaigns (
  brand_slug text primary key,
  mdx_slug text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upsert campaign record without ON CONFLICT
UPDATE public.campaigns
   SET mdx_slug='codeandpepper_digital_designer', active=true, updated_at=now()
 WHERE brand_slug='codeandpepper';
INSERT INTO public.campaigns (brand_slug, mdx_slug, active)
SELECT 'codeandpepper','codeandpepper_digital_designer', true
WHERE NOT EXISTS (SELECT 1 FROM public.campaigns WHERE brand_slug='codeandpepper');

commit;
