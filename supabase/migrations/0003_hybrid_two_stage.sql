-- Two-stage hybrid retrieval to avoid full-table lexical scan
-- Stage 1: take top-N by vector similarity using ivfflat
-- Stage 2: compute ts_rank within that subset and combine scores

create or replace function public.match_chunks_hybrid_two_stage(
  query_text text,
  query_embedding vector(1536),
  vec_k int default 200,
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
  ), vec_top as (
    select
      c.id as chunk_id,
      d.id as document_id,
      (1 - (c.embedding <=> query_embedding)) as vec_score,
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
    where (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
    order by c.embedding <=> query_embedding asc
    limit vec_k
  ), scored as (
    select
      v.chunk_id,
      v.document_id,
      v.vec_score,
      ts_rank(to_tsvector('simple', v.text), q.tsq) as lex_score,
      v.text,
      v.file,
      v.source_name,
      v.source_type,
      v.role,
      v.tech,
      v.org,
      v.product,
      v.domain,
      v.kpis,
      v.aliases,
      v.link,
      v.date
    from vec_top v
    cross join q
  ), norms as (
    select
      *,
      case when max(lex_score) over () > 0 then lex_score / max(lex_score) over () else 0 end as lex_norm
    from scored
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
