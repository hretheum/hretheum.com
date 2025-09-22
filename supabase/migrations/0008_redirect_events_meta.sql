-- Add meta JSONB column to redirect_events to store auxiliary fields (e.g., middleware latency)
alter table if exists public.redirect_events
  add column if not exists meta jsonb null;
