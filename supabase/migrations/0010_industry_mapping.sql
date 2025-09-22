-- Industry mapping and telemetry tables
-- brand_industries: source of truth for brand -> industry mapping
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

-- brand_industry_suggestions: buffer of LLM or rules-based suggestions
create table if not exists public.brand_industry_suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  brand_slug text not null,
  industry text not null check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','Generic')),
  confidence float8 not null default 0,
  source text not null default 'llm',
  dismissed boolean not null default false,
  expires_at timestamptz null
);
create index if not exists brand_industry_suggestions_slug_idx on public.brand_industry_suggestions (brand_slug);
create index if not exists brand_industry_suggestions_created_idx on public.brand_industry_suggestions (created_at desc);
create index if not exists brand_industry_suggestions_active_idx on public.brand_industry_suggestions (dismissed, expires_at);

-- industry_resolution_events: telemetry of how industry was resolved in SSR
create table if not exists public.industry_resolution_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  brand_slug text not null,
  source text not null check (source in ('deterministic','db','llm','llm_auto','generic')),
  industry text not null check (industry in ('SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','Generic')),
  confidence float8 null,
  note jsonb null
);
create index if not exists industry_resolution_events_created_idx on public.industry_resolution_events (created_at desc);
create index if not exists industry_resolution_events_slug_idx on public.industry_resolution_events (brand_slug);

-- RLS: enable and keep read/write restricted (server-only via service role)
alter table public.brand_industries enable row level security;
alter table public.brand_industry_suggestions enable row level security;
alter table public.industry_resolution_events enable row level security;
-- No public policies; server uses service role. 
