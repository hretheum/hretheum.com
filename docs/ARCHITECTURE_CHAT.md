# Chat System Architecture

## 1. High-Level Diagram

```mermaid
flowchart TD
  U[User] -->|Message| API[/api/rag/query]
  API --> INTENT[classifyIntent()]
  INTENT -->|intent id| EXP[Query Expansion]
  EXP -->|variants| RETRIEVAL{RAG_STORE}
  RETRIEVAL -->|json| JSON[(In-memory index)]
  RETRIEVAL -->|supabase| SUPA[(Supabase: Postgres + pgvector)]
  SUPA --> RPC[RPC: match_chunks_hybrid_two_stage]
  JSON --> AGG[Aggregate + Boost]
  RPC --> AGG
  AGG --> MMR[Selection + MMR]
  MMR --> PROMPT[Prompt Composer]
  PROMPT --> LLM[Generator]
  LLM --> RESP[Answer + Citations]
  RESP -->|stream/json| U
```

## 2. Key Components
- **Endpoint**: `app/api/rag/query/route.ts`
  - Intent detection (embedding-first) + optional LLM tie-break.
  - Query expansion guided by intent, with ENV-controlled count.
  - Retrieval over JSON or Supabase (feature-flag via `RAG_STORE`).
  - Hybrid aggregation, intent-based boosts, widen-then-prune selection with MMR.
  - Telemetry logs: intent meta + phase timings.

- **Supabase**
  - Tables: `public.documents`, `public.chunks(embedding vector(1536))`.
  - RPC:
    - `match_chunks_hybrid(text, vector(1536), int, float)` (inline tsvector; no GIN required)
    - `match_chunks_hybrid_two_stage(text, vector(1536), int, int, float)`
  - Security:
    - RLS: SELECT policies for `anon, authenticated` on `documents`, `chunks`.
    - Grants: `EXECUTE` on both RPC for `anon, authenticated`.

## 3. Retrieval Details
- **Two-stage hybrid** (Supabase): ANN shortlist by vector, then lexical scoring (`ts_rank`) over the shortlist. Score = `0.6*vec + 0.4*lex_norm`.
- **PRF seed**: lexical-only seed via `match_chunks_hybrid` with zero embedding, to mine top terms.
  - Skip PRF if `prf_seed_ms > 500ms` to avoid latency spikes.
- **Aggregation & Selection**:
  - Merge candidates across expansions (max-update by score).
  - Apply intent-based metadata boosts.
  - MMR to reduce redundancy; token-budgeted K growth up to 12.

## 4. Performance Optimizations
- ENV-tunable RPC params:
  - `RAG_VEC_K` (shortlist size), `RAG_MATCH_COUNT` (rows per RPC), `RAG_EXPANSIONS` (number of expansions).
- LRU cache for expansions embeddings (50 entries) to reduce `embed_ms`.
- Parallelize RPC calls across expansions (Promise.all) in Supabase mode.

## 5. Environment Variables (Runtime)
- `RAG_STORE` = `supabase | json` – choose retrieval backend.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon client.
- `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY` – embeddings and generation.
- `RAG_VEC_K` – default 120 (we use 100). Lower → mniej latency, wyższe ryzyko utraty rzadkich trafień.
- `RAG_MATCH_COUNT` – default 30.
- `RAG_EXPANSIONS` – default 3 (u nas 2). Mniej → niższe `embed_ms`.

## 6. Ingestion (Service Role; out of request path)
- Wymagane tylko dla procesu ingestu: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Runtime nigdy nie używa klucza service role.

## 7. Telemetry
- `[rag.query:intent]`: `msg`, `intent`, `confidence`, `selectedCount`, `top1Boosted`.
- `[rag.query:telemetry]`: `embed_ms`, `prf_seed_ms`, `hybrid_rpc_ms`, `selection_mmr_ms`, `llm_answer_ms`, `total_ms`, `pool_size`.

## 8. Troubleshooting
- 400/`Invalid input` – zwykle brak/niepoprawne Embedding vector(1536) lub zły JSON w RPC; sprawdź ENV i kształt argumentów.
- `stack depth limit exceeded` – występuje gdy istnieją wrappery `(text, vector, ...)` i rekurencyjnie wołają same siebie. Usuń wrappery, zostaw tylko `vector(1536)`.
- `maintenance_work_mem` przy dodawaniu `tsv` – używamy inline `to_tsvector(...)` w funkcjach, nie tworzymy kolumny.
