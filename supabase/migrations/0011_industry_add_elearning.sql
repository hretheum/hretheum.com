-- Extend allowed industry values to include 'eLearning'
-- brand_industries
alter table public.brand_industries drop constraint if exists brand_industries_industry_check;
alter table public.brand_industries add constraint brand_industries_industry_check check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Generic'));

-- brand_industry_suggestions
alter table public.brand_industry_suggestions drop constraint if exists brand_industry_suggestions_industry_check;
alter table public.brand_industry_suggestions add constraint brand_industry_suggestions_industry_check check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Generic'));

-- industry_resolution_events
alter table public.industry_resolution_events drop constraint if exists industry_resolution_events_industry_check;
alter table public.industry_resolution_events add constraint industry_resolution_events_industry_check check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','eLearning','Generic'));
