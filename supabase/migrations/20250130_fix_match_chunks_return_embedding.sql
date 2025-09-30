-- Phase 1: Fix match_chunks RPC to return embedding as array
-- Migration: 20250130_fix_match_chunks_return_embedding.sql
-- Issue: lib/rag_store/supabase.ts expects embedding in results but RPC doesn't return it
-- Root cause: Supabase PostgREST returns pgvector as JSON string, not array
-- Solution: Return embedding column explicitly in RPC results

-- Backup old function as _legacy (keep for 1 sprint)
create or replace function public.match_chunks_legacy(
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
    1 - (c.embedding <=> query_embedding) as score,
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

-- Updated function WITH embedding in results
-- CRITICAL: Cast embedding::text to ensure PostgREST returns it as JSON string
-- Client-side parseEmbedding() will handle conversion to array
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
  embedding text,  -- ADDED: Return as text (PostgREST will JSON-serialize)
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
    1 - (c.embedding <=> query_embedding) as score,
    c.text,
    c.embedding::text as embedding,  -- ADDED: Cast to text for JSON serialization
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

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';

-- Validation: Test RPC returns embedding
-- Run manually: SELECT embedding FROM match_chunks(ARRAY[...]::vector(1536), 1, 0.0) LIMIT 1;
