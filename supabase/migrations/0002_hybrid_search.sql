-- Hybrid retrieval: pgvector cosine + lexical ts_rank with generated tsvector column
-- Comments in English per project rules.

-- 1) Lexical tsvector column (generated) and GIN index
alter table public.chunks
  add column if not exists tsv tsvector generated always as (to_tsvector('simple', text)) stored;

-- NOTE: Creating a GIN index can exceed maintenance_work_mem on shared plans.
-- Run this separately as a standalone statement (outside a transaction) if needed:
--   create index concurrently chunks_tsv_gin on public.chunks using gin(tsv);

-- 2) Hybrid RPC: weighted sum of vector similarity and lexical rank
-- Usage:
--   select * from match_chunks_hybrid(
--     'your query text',
--     ARRAY[...numbers...]::vector(1536),
--     50, -- match_count
--     0.0 -- similarity_threshold on vector score (0..1)
--   );
create or replace function public.match_chunks_hybrid(
  query_text text,
  query_embedding vector(1536),
  match_count int default 30,
  similarity_threshold float default 0.0
)
returns table (
  chunk_id uuid,
  document_id uuid,
  score float,
  vec_score float,
  lex_score float,
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
  with q as (
    select plainto_tsquery('simple', query_text) as tsq
  ), base as (
    select
      c.id as chunk_id,
      d.id as document_id,
      (1 - (c.embedding <=> query_embedding)) as vec_score,
      ts_rank(c.tsv, q.tsq) as lex_score,
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
    cross join q
    where (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
       or c.tsv @@ q.tsq
  ), norms as (
    select
      *,
      case when max(lex_score) over () > 0 then lex_score / max(lex_score) over () else 0 end as lex_norm
    from base
  )
  select
    chunk_id,
    document_id,
    (0.6 * vec_score + 0.4 * lex_norm) as score,
    vec_score,
    lex_score,
    text,
    file,
    source_name,
    source_type,
    role,
    tech,
    org,
    product,
    domain,
    kpis,
    aliases,
    link,
    date
  from norms
  order by (0.6 * vec_score + 0.4 * lex_norm) desc
  limit match_count;
$$;
