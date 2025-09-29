-- LL-1.1 Job Posting Intelligence Integration
-- Add job_postings table for storing original job postings content
-- Used for contextual RAG queries and semantic analysis

begin;

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null references public.campaigns(brand_slug) on delete cascade,
  url text not null, -- original job posting URL
  title text not null,
  company text not null,
  content text not null, -- full job posting content
  requirements text, -- extracted requirements section
  skills text[], -- array of required skills
  location text,
  employment_type text check (employment_type in ('full-time', 'part-time', 'contract', 'internship')),
  experience_level text check (experience_level in ('entry', 'mid', 'senior', 'lead', 'executive')),
  salary_range_min integer,
  salary_range_max integer,
  salary_currency text default 'PLN',
  posted_date date,
  expires_date date,
  is_active boolean not null default true,
  metadata jsonb default '{}', -- additional scraped data
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Ensure one active posting per brand at a time
  constraint unique_active_posting_per_brand
  exclude (brand_slug with =)
  where (is_active = true)
);

-- Index for efficient lookups
create index if not exists idx_job_postings_brand_slug on public.job_postings(brand_slug);
create index if not exists idx_job_postings_active on public.job_postings(is_active) where is_active = true;
create index if not exists idx_job_postings_posted_date on public.job_postings(posted_date desc);

-- Trigger to update updated_at
create or replace function update_job_postings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger job_postings_updated_at
  before update on public.job_postings
  for each row
  execute function update_job_postings_updated_at();

-- RLS policies
alter table public.job_postings enable row level security;

-- Users can read job postings for their campaigns
create policy "Users can view job postings for accessible campaigns"
on public.job_postings for select
using (
  exists (
    select 1 from public.campaigns c
    where c.brand_slug = job_postings.brand_slug
    and c.active = true
  )
);

-- Only authenticated users can insert/update job postings
create policy "Authenticated users can manage job postings"
on public.job_postings for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

commit;