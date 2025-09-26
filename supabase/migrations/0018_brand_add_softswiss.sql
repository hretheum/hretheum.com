-- Extend allowed industry values to include 'iGaming' before seeding brand mapping

-- brand_industries
alter table public.brand_industries drop constraint if exists brand_industries_industry_check;
alter table public.brand_industries add constraint brand_industries_industry_check
  check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Telecom','Retail','DigitalTech','Generic','Dummy','iGaming'));

-- brand_industry_suggestions
alter table public.brand_industry_suggestions drop constraint if exists brand_industry_suggestions_industry_check;
alter table public.brand_industry_suggestions add constraint brand_industry_suggestions_industry_check
  check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Telecom','Retail','DigitalTech','Generic','Dummy','iGaming'));

-- industry_resolution_events
alter table public.industry_resolution_events drop constraint if exists industry_resolution_events_industry_check;
alter table public.industry_resolution_events add constraint industry_resolution_events_industry_check
  check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Telecom','Retail','DigitalTech','Generic','Dummy','iGaming'));

-- Seed mapping for brand 'softswiss' to industry 'iGaming'
-- Mirrors pattern from 0017_brand_add_efigence.sql
insert into public.brand_industries (brand_slug, industry, status, updated_by, note)
values ('softswiss','iGaming','manual','migration_0018', '{"source":"migration"}'::jsonb)
on conflict (brand_slug) do update set
  industry = excluded.industry,
  status = 'manual',
  updated_by = 'migration_0018',
  updated_at = now();
