-- Fluxon campaign migration — safe for mixed schemas
-- Strategy: no ON CONFLICT; UPDATE→INSERT; no FK; no constraint renames
-- Requires brand_industries.brand_slug already (per 0010_industry_mapping.sql)

begin;

-- Ensure brand_industries exists (shape per 0010). If already exists, this is a no-op.
create table if not exists public.brand_industries (
  brand_slug text primary key,
  industry text not null,
  status text not null default 'manual',
  updated_by text null,
  updated_at timestamptz not null default now(),
  note jsonb null
);

-- Upsert mapping for fluxon (DigitalTech)
update public.brand_industries
   set industry='DigitalTech', status='manual', updated_at=now()
 where brand_slug='fluxon';
insert into public.brand_industries (brand_slug, industry, status, updated_at)
select 'fluxon','DigitalTech','manual', now()
where not exists (select 1 from public.brand_industries where brand_slug='fluxon');

-- Ensure campaigns exists (simple registry; no FK to avoid cross-schema breakage)
create table if not exists public.campaigns (
  brand_slug text primary key,
  mdx_slug text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upsert campaign record for fluxon
update public.campaigns
   set mdx_slug='fluxon_senior_product_designer', active=true, updated_at=now()
 where brand_slug='fluxon';
insert into public.campaigns (brand_slug, mdx_slug, active)
select 'fluxon','fluxon_senior_product_designer', true
where not exists (select 1 from public.campaigns where brand_slug='fluxon');

commit;
