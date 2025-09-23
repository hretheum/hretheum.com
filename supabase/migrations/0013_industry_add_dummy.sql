-- Extend allowed industry values to include 'Dummy' and allow new source 'llm_lowconf'

-- brand_industries
alter table public.brand_industries drop constraint if exists brand_industries_industry_check;
alter table public.brand_industries add constraint brand_industries_industry_check
  check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Telecom','Generic','Dummy'));

-- brand_industry_suggestions
alter table public.brand_industry_suggestions drop constraint if exists brand_industry_suggestions_industry_check;
alter table public.brand_industry_suggestions add constraint brand_industry_suggestions_industry_check
  check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Telecom','Generic','Dummy'));

-- industry_resolution_events (both industry and source checks)
alter table public.industry_resolution_events drop constraint if exists industry_resolution_events_industry_check;
alter table public.industry_resolution_events add constraint industry_resolution_events_industry_check
  check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Telecom','Generic','Dummy'));

alter table public.industry_resolution_events drop constraint if exists industry_resolution_events_source_check;
alter table public.industry_resolution_events add constraint industry_resolution_events_source_check
  check (source in ('deterministic','db','llm','llm_auto','llm_lowconf','generic'));
