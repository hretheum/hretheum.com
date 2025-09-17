-- Add parent_id to link assistant_answer to its user_message turn
alter table public.chat_events
  add column if not exists parent_id uuid null references public.chat_events(id) on delete set null;

create index if not exists chat_events_parent_id_idx on public.chat_events(parent_id);
