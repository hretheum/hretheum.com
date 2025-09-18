-- Migration: chat threads and turn indexing
-- Adds thread_id and turn_index to chat_events for stable pairing
-- Safe to run multiple times (IF NOT EXISTS guards where possible)

alter table public.chat_events add column if not exists thread_id uuid;
alter table public.chat_events add column if not exists turn_index int;

create index if not exists chat_events_thread_turn_idx on public.chat_events(thread_id, turn_index);
create index if not exists chat_events_session_time_idx on public.chat_events(session_id, created_at);

-- Backfill v1: set thread_id = session_id when it looks like UUID (36 chars with dashes)
update public.chat_events
set thread_id = (case when length(session_id) = 36 then session_id::uuid else thread_id end)
where thread_id is null and session_id is not null;

-- Backfill v1: assign turn_index for user_message per thread by created_at
with numbered as (
  select id, thread_id,
         row_number() over (partition by thread_id order by created_at) - 1 as rn
  from public.chat_events
  where type = 'user_message' and thread_id is not null
)
update public.chat_events e
set turn_index = n.rn
from numbered n
where e.id = n.id and e.turn_index is null;

-- Copy turn_index to assistants where parent_id is known
update public.chat_events a
set turn_index = u.turn_index
from public.chat_events u
where a.type = 'assistant_answer' and a.parent_id = u.id and a.turn_index is null;

-- Note: Further legacy reconciliation (no parent_id) can be handled by an offline task.
