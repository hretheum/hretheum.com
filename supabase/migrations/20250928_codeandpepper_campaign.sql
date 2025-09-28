-- Safe migration for brand mapping and campaigns registry
-- Idempotent: uses IF NOT EXISTS and upserts

begin;

create table if not exists public.brand_industries (
  slug text primary key,
  industry text not null check (industry in (
    'SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Telecom','Retail','DigitalTech','Dummy','Generic'
  )),
  created_at timestamptz not null default now()
);

-- Upsert mapping for codeandpepper
insert into public.brand_industries (slug, industry)
values ('codeandpepper','DigitalTech')
on conflict (slug) do update set industry = excluded.industry;

create table if not exists public.campaigns (
  brand_slug text primary key references public.brand_industries(slug) on delete cascade,
  mdx_slug text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upsert campaign record
insert into public.campaigns (brand_slug, mdx_slug, active)
values ('codeandpepper','codeandpepper_digital_designer', true)
on conflict (brand_slug) do update set mdx_slug = excluded.mdx_slug, active = excluded.active, updated_at = now();

commit;