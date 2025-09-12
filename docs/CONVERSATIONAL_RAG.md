# Conversational RAG Assistant for Recruiters

## 1. Goal & Scope
- Purpose: Provide a conversational assistant that answers recruiter-style questions about Eryk's competencies, experience, leadership approach, and case studies using natural language.
- Scope (MVP):
  - [cleaned — completed]
- Out of scope (MVP):
  - PDF parsing, web crawling, advanced reranking, advanced analytics dashboards.

## 2. Non-Goals
- General open-domain Q&A.
- Generating new claims without sourcing from ingested data.

## 3. Data Sources & Privacy
- Sources (phase 1): curated Markdown files (competencies, leadership philosophy, case studies summaries, bio, FAQ).
- Structure: each file segmented into semantic sections with metadata frontmatter (type, role, tech, date, link).
- Privacy & Redaction:
  - Remove sensitive PII beyond what is public on portfolio/LinkedIn.
  - Avoid including confidential client data; anonymize if needed.
  - Include a data provenance note in the docs and system prompt.

## 4. Architecture Overview
- Frontend: Next.js client component for sticky chat (bottom dock), streaming responses, rendering citations. [Status: Partial — responses currently non-streaming]
  - `/api/rag/query` – embed query → KNN search → prompt compose → stream answer with sources. [Status: Partial — non-streaming]
- Future Store: Vercel Postgres + pgvector. [Status: Pending]

## 5. Chunking & Metadata
- Chunk size: 500–1000 tokens, overlap 100–150. [Status: Partial — exact tokenization configurable]
- Strategy: break on headings/paragraphs; keep semantic boundaries. [Status: Partial]
- Metadata fields: [Status: Partial]
  - `source_type` (competency | leadership | case_study | bio | faq)
  - `source_name` (e.g., "ING Onboarding DS")
  - `role` (e.g., Head of Design)
  - `tech` (e.g., Figma, React, Tailwind, pgvector)
  - `date` (ISO, optional)
  - `link` (deep link to portfolio section)

## 6. Retrieval & Reranking
- Retrieval: cosine similarity over normalized embeddings; take top-k (k=5). [Status: Done]
- Optional reranking: light MMR or in-prompt reordering based on coverage + diversity. [Status: Partial — dynamic threshold + metadata boosts implemented; MMR pending]
- Filters/Boosting: optional topic filters (competencies/experience/leadership) to boost relevant chunks. [Status: Done — intent-based boosts]

## 7. Prompting & Answer Format
- System Prompt (summary): [Status: Partial — concise narrative prompt, citations handled by UI]
  - "You are Eryk's recruiting assistant. Answer concisely with a professional, narrative tone. Use only provided sources. If insufficient evidence, say so and suggest next steps or a link to contact. Always include Citations with exact quotes and links."
- Output contract (JSON streamed or structured blocks):
  - `answer`: markdown string
  - `citations`: list of `{quote, source_name, link}`
- Safety behavior: abstain if low similarity or conflicting info; avoid speculation. [Status: Partial — abstain/low-confidence path implemented; moderation pending]

## 8. Guardrails
- Input moderation (toxicity/NSFW); denylist for certain topics. [Status: Pending]
- Knowledge boundaries: explicit "I don't have enough information" path. [Status: Done]
- Tone control: professional, narrative, no exaggerations. [Status: Done]
- Logging PII: do not persist user queries beyond anonymous analytics. [Status: Pending]

## 9. Quality Gates
- Answer accuracy against ground-truth MD.
- Faithfulness: quoted text must appear in sources.
- Coverage: key thematic areas covered by eval set.
- Hallucination rate below defined threshold.
- Latency SLO (p95 < 2.5s for typical queries with cache warm).
- Cost budget per 100 queries.

## 10. Definition of Done (DoD)
- Query route returns streamed answer with at least 2 citations. [Status: Partial — non-streaming, returns citations]
- Guardrails (moderation + abstain path) enabled. [Status: Partial — abstain in place; moderation pending]

## 11. Metrics of Success
- Content satisfaction (thumbs up/down rate ≥ 80% positive).
- CTR to portfolio sections from answers ≥ 20%.
- Session time on Q&A ≥ 2 min average for engaged users.
- Abstain rate within 5–15% (healthy boundary signaling).
- Cost per 100 queries within target (e.g., <$0.50 for MVP).

## 12. Validation Methods
- Offline eval set: 30–50 questions across competencies/experience/leadership. [Status: Pending]
- Automated checks: exact-quote verification for citations. [Status: Pending]
- Human review: weekly spot-check of 10 conversations. [Status: Pending]
- Canary release: enable for a limited audience; monitor metrics. [Status: Pending]

## 13. Model & Gateway Strategy
- Default cheap models via Vercel AI Gateway (examples; choose per availability/cost): [Status: Done]
  - Generation: small/efficient instruction-tuned (e.g., provider aliases for Llama 3.1 8B Instruct, Qwen 2.5 7B Instruct, or Mixtral 8x7B).
  - Embeddings: economical English embeddings with good recall.
- Hot-swap: switch providers via env vars without code changes. [Status: Done]
- Caching: cache system prompts and stable tool instructions in Gateway. [Status: Pending]

## 14. Branching & Deployment
- Ensure the GitHub repository is private. [Status: Pending]

## 15. Risks & Mitigations
- Risk: Hallucinations → Mitigation: strict citation requirement + abstain.
- Risk: Data sensitivity → Mitigation: redaction policy, review before ingest.
- Risk: Latency/cost spikes → Mitigation: cheap defaults, caching, top-k tuning.
- Risk: Incomplete coverage → Mitigation: extend MD corpus iteratively.

## 16. Roadmap (Post-MVP)
- PDF and web source ingestion. [Status: Pending]
- Vercel Postgres + pgvector migration. [Status: Pending]
- Reranking model / LLM-as-a-reranker. [Status: Pending]
- Analytics dashboard and feedback loop for content improvement. [Status: Pending]

## 17. Migration Plan to pgvector (Vercel Postgres)

1) Database setup
- Create Vercel Postgres database and enable pgvector extension.
- Define schema for documents and embeddings:
  - `documents(id uuid pk, source_name text, source_type text, role text, tech text[], date timestamptz, link text)`
  - `chunks(id uuid pk, document_id uuid fk -> documents(id), text text, embedding vector(1536), created_at timestamptz default now())`
- Add indexes:
  - `CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`
  - `CREATE INDEX ON documents (source_type, date);`

2) Ingestion pipeline changes
- Parse MD → chunk as today, but write documents/chunks to Postgres.
- Generate embeddings and store to `chunks.embedding`.
- Keep a one-time backfill job to migrate existing `data/index.json`.

3) Retrieval changes
- Replace in-memory cosine with SQL KNN:
  - `SELECT c.*, d.source_name, d.source_type, d.link FROM chunks c JOIN documents d ON d.id=c.document_id ORDER BY c.embedding <=> $1 LIMIT $k;`
- Maintain dynamic thresholding and intent-based boosts in application layer.

4) API updates
- `/api/rag/ingest`: write to Postgres inside transaction; batch embeddings.
- `/api/rag/query`: query pgvector; map rows to contexts and citations.

5) Observability & ops
- Add basic metrics for query latency and hit ratio.
- Daily consistency check comparing JSON store vs. Postgres (during transition).

6) Rollout plan
- Phase 1: dual-write (JSON + Postgres), read from JSON.
- Phase 2: read from Postgres behind an env flag.
- Phase 3: remove JSON, keep Postgres as sole source of truth.

7) Env & secrets
- `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGPORT`, plus connection string if preferred.
- Feature flag: `RAG_STORE=pgvector|json`.
