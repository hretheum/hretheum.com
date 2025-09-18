# Conversational RAG Assistant — Project README

> Next.js app with a recruiter-style chat that answers from a curated knowledge base. Retrieval runs over Supabase (pgvector) or a JSON fallback.

## Quickstart (Dev)

```bash
# install
npm i

# set env (copy the example and fill values)
cp .env.example .env
# minimally provide: OPENAI_API_KEY (or AI_GATEWAY_API_KEY),
# RAG_STORE=supabase, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# run dev server
npm run dev
# http://localhost:3000
```

## Smoke Tests
Validate the query endpoint end‑to‑end and print latency and intent.

```bash
npx tsx scripts/smoke_queries.ts
# Output: [status] <latency>ms | intent=<id> (<conf>) | <query>
```

Optional:
- `SMOKE_ENDPOINT=http://localhost:3000/api/rag/query?stream=0` to override target.

## Ingestion (Supabase)
Ingestion writes Markdown sources into `public.documents`/`public.chunks` and populates embeddings (vector(1536)). Service role key is required only for ingest; runtime uses anon.

High‑level steps:
- Prepare Markdown in `data/rag/` with frontmatter metadata.
- Run ingest script (service role). If not present yet in this repo, follow docs below to create it or perform a manual import.

See: `docs/playbooks/PROJECT_CONTENT_TEMPLATES.md` and `docs/playbooks/CONTENT_PLAYBOOK.md` for content structure, and `docs/CONVERSATIONAL_RAG.md` §23 for RPC schema.

## Environment Variables

Runtime (query route `app/api/rag/query/route.ts`):
- `RAG_STORE` — `supabase | json` (select backend)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon client
- `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY` — embeddings + generation
- `RAG_VEC_K` — shortlist size for two‑stage hybrid (default 120; recommended 100)
- `RAG_MATCH_COUNT` — rows per RPC (default 30)
- `RAG_EXPANSIONS` — number of query expansions (default 3; recommended 2)
- `RAG_RETURN_CITATIONS` — `true|false` (default false). When true, API responses include `citations`; UI can consume them if desired. By default, citations are logged only in server telemetry and Sources UI is hidden.

Ingest only (service role; not used by runtime):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

More details: `docs/CONVERSATIONAL_RAG.md` §22 and `docs/ARCHITECTURE_CHAT.md`.

## Architecture & Docs
- Architecture: `docs/ARCHITECTURE_CHAT.md`
- Conversational RAG Guide: `docs/CONVERSATIONAL_RAG.md`
- Playbooks:
  - Retrieval: `docs/playbooks/RETRIEVAL_PLAYBOOK.md`
  - Content Authoring: `docs/playbooks/CONTENT_PLAYBOOK.md`
  - Project Content Templates: `docs/playbooks/PROJECT_CONTENT_TEMPLATES.md`
  - Validation/Smoke: `docs/playbooks/VALIDATION_PLAYBOOK.md`
  - Gateway: `docs/playbooks/GATEWAY_PLAYBOOK.md`
  - Operations/Security: `docs/playbooks/OPERATIONS_SECURITY_PLAYBOOK.md`

## Supabase Setup (RPC & Security)
- Required functions (pgvector):
  - `match_chunks_hybrid(text, vector(1536), int, float)`
  - `match_chunks_hybrid_two_stage(text, vector(1536), int, int, float)`
- Grants:
  - `grant execute on function ... to anon, authenticated`
- RLS:
  - SELECT policies on `public.documents` and `public.chunks` for `anon, authenticated`
- Notes: inline `to_tsvector('simple', text)` in functions (no generated `tsv` column needed)

## Observability
- The route logs intent and timings:
  - `[rag.query:intent]` → `msg`, `intent`, `confidence`, `selectedCount`, `top1Boosted`
  - `[rag.query:telemetry]` → `embed_ms`, `prf_seed_ms`, `hybrid_rpc_ms`, `selection_mmr_ms`, `llm_answer_ms`, `total_ms`, `pool_size`

- GTM/GA4 Chat Telemetry: see `docs/TELEMETRY_GTM_GA4.md`

## Dev Auth Setup (localhost)

Localhost URLs to configure for Supabase Auth and Google OAuth when testing the Admin Console locally.

### Supabase → Authentication → URL Configuration
- **Site URL**
  - `http://localhost:3000`
- **Redirect URLs** (one per line)
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/admin`
  - (optional) `http://localhost:3000/`

### Google Cloud Console → OAuth 2.0 Client (Web application)
- **Authorized JavaScript origins**
  - `http://localhost:3000`
  - (optional) `http://127.0.0.1:3000`
- **Authorized redirect URIs**
  - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
    - Replace `<PROJECT_REF>` with your Supabase project ref.

Notes:
- Supabase handles the OAuth redirect; localhost goes into "JavaScript origins" only.
- After changes, log out and log in again at `/admin` (use incognito for clean cookies).

### Env checklist (.env for local dev)
- `NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`
- `ADMIN_EMAILS=eof@offline.pl`

## FAQ
- 400 `Invalid input` from RPC? Ensure vectors are `vector(1536)` and payload JSON matches RPC signature.
- `stack depth limit exceeded`? Remove wrapper functions on `(text, vector, ...)` and keep only `(vector(1536))` signatures.
- Slow first run? Cold start (embeddings/model/gateway). Subsequent runs are faster; tune `RAG_VEC_K`/`RAG_EXPANSIONS`.
