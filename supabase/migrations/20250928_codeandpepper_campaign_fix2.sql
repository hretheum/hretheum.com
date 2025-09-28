-- Canonical fix: align with existing schema from 0010_industry_mapping.sql
-- Uses brand_industries.brand_slug as PK and avoids renames.

begin;

-- Ensure base table exists (schema mirrors earlier migration 0010; IF NOT EXISTS is safe)
create table if not exists public.brand_industries (
  brand_slug text primary key,
  industry text not null check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','Generic')),
  status text not null default 'manual' check (status in ('auto','manual','locked')),
  updated_by text null,
  updated_at timestamptz not null default now(),
  note jsonb null
);
create index if not exists brand_industries_industry_idx on public.brand_industries (industry);
create index if not exists brand_industries_status_idx on public.brand_industries (status);
alter table public.brand_industries enable row level security;

-- Extend industry enum set if needed (DigitalTech introduced in 0016)
-- If your instance missed 0016, temporarily relax constraint for this upsert
-- by skipping validation (optional, commented out):
-- alter table public.brand_industries drop constraint if exists brand_industries_industry_check;
-- alter table public.brand_industries add constraint brand_industries_industry_check
--   check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Telecom','Retail','DigitalTech','Generic')) not valid;

-- Upsert mapping for codeandpepper using existing PK (brand_slug)
insert into public.brand_industries (brand_slug, industry, status, updated_by, updated_at)
values ('codeandpepper','DigitalTech','manual', null, now())
on conflict (brand_slug) do update
  set industry = excluded.industry,
      status = 'manual',
      updated_at = now();

-- Campaigns registry (new)
create table if not exists public.campaigns (
  brand_slug text primary key,
  mdx_slug text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_brand_fk foreign key (brand_slug) references public.brand_industries(brand_slug) on delete cascade
);

-- Upsert campaign record
insert into public.campaigns (brand_slug, mdx_slug, active)
values ('codeandpepper','codeandpepper_digital_designer', true)
on conflict (brand_slug) do update set mdx_slug = excluded.mdx_slug, active = excluded.active, updated_at = now();

commit;
