-- vercel_drain_events: raw request logs via Vercel Custom HTTP Drain
create table if not exists public.vercel_drain_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  host text not null,
  status int2 not null,
  method text null,
  path text null,
  user_agent text null
);

create index if not exists vercel_drain_events_created_at_idx on public.vercel_drain_events (created_at desc);
create index if not exists vercel_drain_events_status_idx on public.vercel_drain_events (status);
create index if not exists vercel_drain_events_host_idx on public.vercel_drain_events (host);

alter table public.vercel_drain_events enable row level security;
-- No public policies: writes happen via server (service role). No read access for anon/auth by default.
