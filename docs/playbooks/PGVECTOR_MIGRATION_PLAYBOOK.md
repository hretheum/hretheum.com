# pgvector Migration Playbook

End-to-end plan to move from local JSON to Vercel Postgres + pgvector.

## Schema
- `documents(id uuid pk, source_name text, source_type text, role text, tech text[], date timestamptz, link text)`
- `chunks(id uuid pk, document_id uuid fk -> documents(id), text text, embedding vector(1536), created_at timestamptz default now())`
- Indexes:
  - `CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`
  - `CREATE INDEX ON documents (source_type, date);`

## Ingestion
- Parse MD → chunk → embed → insert into Postgres; dual-write during transition.
- One-time backfill from `data/index.json`.

## Retrieval
- SQL KNN: `ORDER BY embedding <=> $1 LIMIT $k` join `documents` for metadata.
- Keep dynamic thresholding and intent-based boosts in app layer.

## Rollout
- Phase 1: dual-write (JSON + Postgres), read from JSON.
- Phase 2: read from Postgres via `RAG_STORE=pgvector`.
- Phase 3: remove JSON path.

## ENV
- `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGPORT` or conn string.
- `RAG_STORE=pgvector|json` feature flag.
