-- redirect_events: logs canonicalization entries from subdomains to /brand/<slug>
create table if not exists public.redirect_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_host text not null, -- e.g., zendesk.hretheum.com
  dest_slug text not null,   -- e.g., zendesk
  referer text null,
  user_agent text null
);

create index if not exists redirect_events_created_at_idx on public.redirect_events (created_at desc);
create index if not exists redirect_events_source_host_idx on public.redirect_events (source_host);
create index if not exists redirect_events_dest_slug_idx on public.redirect_events (dest_slug);

alter table public.redirect_events enable row level security;

-- Allow anonymous/authenticated inserts (write-only). No select by default.
create policy redirect_events_insert_any on public.redirect_events
  for insert
  to anon, authenticated
  with check (true);
