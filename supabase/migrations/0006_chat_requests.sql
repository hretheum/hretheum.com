-- chat_requests: lightweight escalation requests from chat (no PII)
create table if not exists public.chat_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved','dismissed')),
  meta jsonb null
);

-- Indexes for querying in admin panel
create index if not exists chat_requests_created_at_idx on public.chat_requests (created_at desc);
create index if not exists chat_requests_session_id_idx on public.chat_requests (session_id);
create index if not exists chat_requests_status_idx on public.chat_requests (status);

-- Enable RLS
alter table public.chat_requests enable row level security;

-- Write-only INSERT for runtime roles
create policy if not exists chat_requests_insert_any on public.chat_requests
  for insert
  to anon, authenticated
  with check (true);

-- No SELECT/UPDATE policies here; admin API will read/manage via Service Role.
