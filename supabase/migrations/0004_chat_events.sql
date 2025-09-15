-- chat_events table to log user messages and telemetry
create table if not exists public.chat_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  type text not null check (type in ('user_message','assistant_answer')),
  message text not null,
  intent text null,
  confidence double precision null,
  timings jsonb null,
  meta jsonb null
);

-- Helpful indexes
create index if not exists chat_events_created_at_idx on public.chat_events (created_at desc);
create index if not exists chat_events_session_id_idx on public.chat_events (session_id);

-- Enable RLS
alter table public.chat_events enable row level security;

-- Write-only for runtime (anon/authenticated) — allow INSERT
create policy chat_events_insert_any on public.chat_events
  for insert
  to anon, authenticated
  with check (true);

-- Deny SELECT by default; explicit read policy not provided (admin API will enforce allowlist)
-- If you later want to allow authenticated reads, add a policy checking user email against an allowlist via a secure function.
