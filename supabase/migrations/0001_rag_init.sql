-- RAG schema for Supabase Postgres with pgvector
-- Comments in English per project rules.

-- Enable pgvector and pgcrypto (for gen_random_uuid)
create extension if not exists vector;
create extension if not exists pgcrypto;

-- Documents table stores per-source metadata (one row per markdown file)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  file text not null unique, -- relative path under data/rag/
  source_name text,
  source_type text,
  role text,
  tech text[],
  org text,
  product text,
  domain text,
  kpis text[],
  aliases text[],
  link text,
  date date,
  created_at timestamptz not null default now()
);

-- Chunks table stores chunked text and embeddings
create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  text text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

-- Index for ANN using cosine distance
create index if not exists chunks_embedding_ivfflat on public.chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Lightweight RLS (opt-in). For now, allow read to anon for experimentation; tighten later.
alter table public.documents enable row level security;
alter table public.chunks enable row level security;

-- documents: public read (idempotent via DO block)
do $$
begin
  create policy "public read documents"
  on public.documents
  for select
  to anon
  using (true);
exception when duplicate_object then
  null;
end $$;

-- chunks: public read (idempotent via DO block)
do $$
begin
  create policy "public read chunks"
  on public.chunks
  for select
  to anon
  using (true);
exception when duplicate_object then
  null;
end $$;

-- RPC to run vector search with metadata join
-- Usage: select * from match_chunks(ARRAY[...numbers...]::vector(1536), 20, 0.5);
create or replace function public.match_chunks(
  query_embedding vector(1536),
  match_count int default 20,
  similarity_threshold float default 0.0
)
returns table (
  chunk_id uuid,
  document_id uuid,
  score float,
  text text,
  file text,
  source_name text,
  source_type text,
  role text,
  tech text[],
  org text,
  product text,
  domain text,
  kpis text[],
  aliases text[],
  link text,
  date date
) language sql stable as $$
  select
    c.id as chunk_id,
    d.id as document_id,
    1 - (c.embedding <=> query_embedding) as score, -- cosine similarity to [0..1]
    c.text,
    d.file,
    d.source_name,
    d.source_type,
    d.role,
    d.tech,
    d.org,
    d.product,
    d.domain,
    d.kpis,
    d.aliases,
    d.link,
    d.date
  from public.chunks c
  join public.documents d on d.id = c.document_id
  where 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  order by c.embedding <=> query_embedding asc
  limit match_count;
$$;
