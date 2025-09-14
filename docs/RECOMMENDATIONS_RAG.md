# Conversational RAG – Comprehensive Recommendations

This document compiles actionable recommendations discussed across code, retrieval, content structure, UI/UX, gateway setup, evaluation, and pgvector migration. It is intended as a practical checklist you can execute incrementally.

## 1) Code and Retrieval

- Dynamic similarity threshold
  - Implement adaptive thresholds based on top-1 similarity after boosts.
  - Suggested policy (already prototyped): high top-1 -> narrower threshold; moderate -> slightly lower; low -> fallback with low-confidence flag.

- Intent-based boosts (Implemented)
  - Infer user intent (competencies/leadership/experience/case_study) and apply metadata-weighted boosts: `source_type`, `tech`, etc.

- Query expansion (Planned)
  - Expand the user query into 2–4 variants based on intent synonyms.
  - Compute similarity per variant, combine (max/mean) before ranking.

- MMR (Maximal Marginal Relevance) (Planned)
  - Reduce redundancy among selected chunks by penalizing items similar to already picked contexts.
  - Simple greedy selection with cosine dissimilarity threshold is sufficient.

- Fallbacks (Implemented/Extend)
  - If no chunk crosses the threshold: take topK by boosted score and mark low-confidence.
  - Always ensure at least one canonical chunk (e.g., bio or leadership) when the query asks about competencies/leadership.

- Prompting
  - Keep system prompt short and precise, avoid tables unless necessary.
  - Let the UI handle the Sources section; ask the model for only the direct answer.

- Streaming (Planned)
  - Switch `/api/rag/query` to stream responses (SSE) using the AI Gateway OpenAI-compatible streaming API.
  - Update the chat UI to render incremental tokens.

- Moderation (Planned)
  - Add light input moderation (toxicity/NSFW denylist) with a safe rejection message.

- Error handling and rate limits
  - Surface informative errors to the UI; implement small retries and backoff for transient 429 from the gateway.

## 2) AI Gateway and Models

- OpenAI-compatible client
  - Prefer gateway API key and baseURL `https://ai-gateway.vercel.sh/v1` (per docs).
  - Model aliases via ENV for hot-swapping:
    - `AI_MODEL_GENERATION=openai/gpt-oss-120b` (example default)
    - `AI_MODEL_EMBEDDINGS=openai/text-embedding-3-small`

- Caching and provider routing (Optional)
  - Configure gateway-side caching for system prompts and tool specs.
  - Adjust provider routing order if needed for cost/latency.

- Observability
  - Use AI Gateway metrics for latency, error codes, model usage; monitor 429 to guide caching or paid credits.

## 3) Content Authoring (data/rag/)

- Canonical documents
  - Core Competencies: concise pillars with quote-ready sentences.
  - Leadership Playbook: org model, coaching, governance, stakeholder alignment with short examples.
  - Case Studies: one file per case (ING, Sportradar, etc.) with Context/Approach/Outcome (metrics) + 2–3 short quotes.
  - Bio/Experience: timeline of roles and responsibilities.
  - FAQ: recruiter-style Q&A for most common questions.

- Frontmatter metadata (YAML)
  - `source_type`: `competencies | leadership | case_study | bio | faq`
  - `source_name`: e.g., "ING Onboarding DS"
  - `role`, `tech[]`, `date`, `link`

- Structure and language
  - Use clear headings (H2/H3) with domain keywords and synonyms.
  - Prefer shorter paragraphs and explicit sentences for quotability (120–160 chars ideal).
  - Repeat critical terms reasonably across canonical and case documents to boost recall.

- Chunking hygiene
  - Break on headings/paragraphs; avoid overly long blocks.
  - Slight overlaps are acceptable but not excessive; favor single-idea chunks.

## 4) UI/UX (Chat)

- Markdown rendering (Implemented)
  - Render assistant messages with `react-markdown` + `remark-gfm` and Tailwind Typography.

- Sources block (Implemented)
  - Present sources below the answer as a clean list with short italic quotes, bold source names, optional links.
  - Trim markdown artifacts from quotes and limit to ~180 chars.

- Confidence messaging (Implemented/Refine)
  - Show a subtle low-confidence badge only when all retrieval strategies produce weak evidence.
  - Offer refinement chips (suggested queries) for better specificity.

- Widget behavior (Implemented)
  - Bottom-right pin, compact mobile mode, minimize with ESC and FAB to restore.
  - Persist minimized state and input draft in `localStorage`.

- Optional UX enhancements
  - Add keyboard shortcut to restore (e.g., Shift+ESC), message history pagination, and multi-turn context previews.

## 5) Validation & Quality

- Offline evaluation (Planned)
  - 30–50 questions covering competencies/experience/leadership; measure accuracy, faithfulness, coverage.

- Exact-quote checks (Planned)
  - Automated verification that cited quotes appear verbatim in sources.

- Human review (Planned)
  - Weekly spot-check ~10 conversations to calibrate tone and evidence.

- Metrics
  - Track satisfaction (thumbs up/down), CTR to portfolio links, session time, abstain rate, and cost/query.

## 6) Persistence and Session Sync

- Chat history (Optional)
  - Store messages in Redis/Vercel KV keyed by session cookie (e.g., `rag_session_id`).
  - Endpoints: `GET/POST /api/chat/messages`, `GET/PUT /api/chat/draft`.
  - TTL for messages (e.g., 7–30 days), pagination support.

- Local draft and minimized state (Implemented)
  - Draft key `ragChatDraft`, minimized key `ragChatMinimized` in `localStorage`.

## 7) pgvector Migration

- Schema
  - `documents(id uuid pk, source_name text, source_type text, role text, tech text[], date timestamptz, link text)`
  - `chunks(id uuid pk, document_id uuid fk -> documents(id), text text, embedding vector(1536), created_at timestamptz default now())`
  - Indexes: `ivfflat` on `embedding` (cosine), btree on `documents(source_type, date)`.

- Ingestion
  - Parse MD → chunk → embed → insert into Postgres; one-time backfill from `data/index.json`.

- Retrieval
  - SQL KNN: `ORDER BY embedding <=> $1 LIMIT $k` and join to `documents` for metadata and optional filters.
  - Keep dynamic threshold and boosts in application layer; consider hybrid FTS+vector later.

- Rollout
  - Phase 1: dual-write (JSON + Postgres), read from JSON.
  - Phase 2: read from Postgres via `RAG_STORE=pgvector` flag.
  - Phase 3: remove JSON path.

- ENV
  - `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGPORT` or full connection string.
  - `RAG_STORE=pgvector|json` feature flag.

## 8) Operations and Security

- Secrets
  - Never commit `.env`; use project-level env vars. Keep repo private.

- PII/Compliance
  - Avoid storing sensitive PII in sources or chat logs. Redact where necessary.

- Rate limits
  - Handle 429 with retries/backoff and consider paid credits for uninterrupted access.

## 9) Quick Wins Checklist

- Lower `RAG_SIMILARITY_THRESHOLD` to `0.60` and increase `RAG_TOP_K` to `7`.
- Implement query expansion and simple MMR.
- Add canonical `competencies.md`, `leadership.md`, case study files with frontmatter.
- Keep quotes short and explicit; add `link` anchors for each canonical section.
- Optionally enable streaming in `/api/rag/query`.
- Prepare pgvector schema and dual-write ingestion.
