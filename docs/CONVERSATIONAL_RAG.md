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
- Optional reranking: LLM adjudication for close top-2 intents; MMR or in-prompt diversity reordering. [Status: Partial — LLM rerank implemented; MMR pending]
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
- Offline eval set: 30–50 questions across competencies/experience/leadership. [Status: Done]
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
The following milestones reflect the authoritative execution plan. Each item links to the relevant section(s) of this document or playbooks.

1) Intent Detector Integration Hardened [Priority: High] [Status: Done]
- Scope: finalize embedding-first intent detection with optional LLM adjudication, thresholds, hard rules.
- Dependencies: Section 18.3; dataset from intent playbook.
- Acceptance: chat uses `classifyIntent()` every turn; low-confidence → clarification; telemetry logged.

2) Retrieval Pipeline Enhancements [Priority: High] [Status: Partial]
- Scope: apply Intent-Based Boosts, Query Expansion (2–4 variants), MMR, Dynamic Thresholding, Fallbacks.
- Dependencies: Section 18.4; `docs/playbooks/RETRIEVAL_PLAYBOOK.md`.
- Acceptance: improved hit-rate with diversity; thresholds adapt to top-1; fallbacks labeled.

3) Non-retrieval Flows Policies [Priority: High]
- Scope: logistics/process/assets/compliance/conversational handling with clarifying questions on uncertainty.
- Dependencies: Section 18.5 and intent taxonomy.
- Acceptance: consistent responses with safe defaults (NDA/privacy) and next-step prompts.

4) Evaluation & Feedback Loop [Priority: Medium] [Status: Done]
- Scope: CSV-based tests for intent accuracy/F1; log borderline (0.40–0.55); expand dataset and re-embed.
- Dependencies: Section 18.8; intent playbook §3.
- Acceptance: automated script + periodic re-embed process documented.

5) Streaming Answers via Gateway [Priority: Medium]
- Scope: switch `/api/rag/query` to streaming SSE with citations.
- Dependencies: Retrieval stable (Milestone 2); Gateway config.
- Acceptance: streamed tokens with stable citations rendering.

6) Vector Store Persistence [Priority: Medium]
- Scope: move from MemoryVectorStore to FAISS/Chroma; warm-up cache on boot.
- Dependencies: Intent dataset stabilizing (Milestone 4).
- Acceptance: persisted index, faster cold starts, re-embed documented.

7) Migration to pgvector (Vercel Postgres) [Priority: Medium]
- Scope: implement Section 17 end-to-end (dual-write → read-switch → JSON removal).
- Dependencies: Milestone 2 done; ENV/feature flags ready.
- Acceptance: production reads from Postgres; parity verified; ops metrics in place.

8) Guardrails & Moderation [Priority: Medium]
- Scope: input moderation, denylist, explicit abstain paths; refine safety prompts.
- Dependencies: Section 8.
- Acceptance: unsafe inputs blocked or de-escalated; logs for moderation events.

9) Analytics & Ops [Priority: Low]
- Scope: dashboard for latency, hit ratio, cost; feedback capture on answers.
- Dependencies: Sections 11, 12, 15; ops playbook.
- Acceptance: weekly report; thresholds tuned from data.

## Playbooks
- Retrieval: see `docs/playbooks/RETRIEVAL_PLAYBOOK.md`
- Content authoring: see `docs/playbooks/CONTENT_PLAYBOOK.md`
- Chat UI: see `docs/playbooks/UI_CHAT_PLAYBOOK.md`
- Gateway setup: see `docs/playbooks/GATEWAY_PLAYBOOK.md`
- Validation & Quality: see `docs/playbooks/VALIDATION_PLAYBOOK.md`
- pgvector Migration: see `docs/playbooks/PGVECTOR_MIGRATION_PLAYBOOK.md`
- Operations & Security: see `docs/playbooks/OPERATIONS_SECURITY_PLAYBOOK.md`

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

# 18. Step-by-Step Runbook (Single Source of Truth)

This section operationalizes the chat pipeline end-to-end and references detailed playbooks where needed.

## 18.1 Overview & Architecture
- User message → Intent Detector → Routing → Retrieval (if applicable) → Generation → Answer with citations.
- Key modules in code: `lib/intent/` (detector, catalog, dataset), `app/api/chat/route.ts`, `app/api/intent/route.ts` (debug).

## 18.2 Setup & Env
- Dependencies: LangChain core, embeddings provider (e.g., OpenAI), model provider via gateway if desired.
- Env: `OPENAI_API_KEY` (or alternative), retrieval thresholds `RAG_TOP_K`, `RAG_SIMILARITY_THRESHOLD`.
- See also: `docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md` (section 2.1 Install).

## 18.3 Intent Routing (Embedding-first + Optional LLM Rerank)
1) Call `classifyIntent(userMessage)` at the start of every turn.
2) If `confidence < 0.45`, set intent to `conversational.clarification` and ask one short clarifying question.
3) Apply hard rules and tie-break priorities:
   - `compliance.nda_privacy` overrides ties.
   - Then: `process.assignment_brief` > `assets.assets_request` > `logistics.compensation` > `retrieval_core.case_study`.
4) If top-2 intents are close, use `rerankWithLLM()` to adjudicate.
5) Structured prompt fallback is allowed using `INTENT_CATALOG` for deterministic JSON output.
- See: `docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md` (sections 2.3–2.5, 5, 6, 7).

## 18.4 Retrieval Flow (for `retrieval_core.*` intents)
When the detected intent belongs to retrieval_core, run the RAG pipeline:
1) Intent-based boosts (metadata):
   - `competencies` → +0.15 to `bio` and +0.15 to `leadership`.
   - `leadership` → +0.20 to `leadership`.
   - `experience` → +0.15 to `experience`.
   - `case_study` → +0.20 to `case_study`.
   - Optional keyword boosts: design systems, AI/RAG/LLM/MCP.
2) Query Expansion: generate 2–4 paraphrases based on the intent synonyms; embed each; aggregate scores (max or mean).
3) MMR: reduce redundancy among top candidates.
4) Dynamic Thresholding: adjust acceptance threshold based on boosted top-1.
5) Fallbacks: if nothing crosses threshold, return boosted top-K and mark low-confidence.
- See: `docs/playbooks/RETRIEVAL_PLAYBOOK.md` (Intent-Based Boosts, Query Expansion, MMR, Dynamic Thresholding, Fallbacks).

## 18.5 Non-retrieval Flows
- `logistics` (availability, scheduling, compensation, location_remote): concise answers using profile metadata; ask one clarifying question if needed.
- `process` (hiring_process, assignment_brief): outline steps, timelines, evaluation; provide next steps.
- `assets` (assets_request, code_or_design_files): share links/attachments or generate a brief case summary with citations.
- `compliance` (nda_privacy, data_processing_ip, accessibility_compliance): follow safe defaults; offer NDA; avoid sensitive specifics.
- `conversational` (smalltalk, clarification, rapport_meta, curveballs_creative): be polite and brief; bridge back to the interview purpose.
- See: intent taxonomy and examples in `docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md` (section 1).

## 18.6 Mapping: Intent → Action
- `retrieval_core.competencies` → Retrieval pipeline + boosts (`bio`, `leadership`).
- `retrieval_core.leadership` → Retrieval + boost (`leadership`).
- `retrieval_core.experience` → Retrieval + boost (`experience`).
- `retrieval_core.case_study` → Retrieval + boost (`case_study`).
- Others (`role_fit.*`, `logistics.*`, `process.*`, `assets.*`, `compliance.*`, `conversational.*`) → Non-retrieval flows.

## 18.7 Code Integration Points
- `lib/intent/intents.ts`, `catalog.ts`, `dataset.ts`, `vectorStore.ts`, `classify.ts`, `rerank.ts`.
- Endpoints: `app/api/intent/route.ts` (debug) and `app/api/chat/route.ts` (main path).
- Apply boosts in the retrieval layer before MMR/thresholding to influence ranking.

## 18.8 Evaluation & Monitoring
- Minimal loop: CSV of prompts → run `classifyIntent` → compute accuracy/F1.
- Log borderline samples (0.40–0.55) and expand dataset; re-embed after updates.
- Telemetry: `(query, topIntent, confidence, topK evidence, rerankUsed)`.
  - Implementation: console logs in `app/api/rag/query/route.ts` emit objects for low-confidence and normal flows.
  - Fields (normal): `msg` (first 120 chars), `intent`, `confidence`, `selectedCount`, `top1Boosted`.
  - Fields (low-confidence): `msg`, `intent`, `confidence`, `note: 'low-confidence'`.
- See: `docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md` (section 3).

## 18.9 Maintenance
- Keep `INTENT_CATALOG` and `DATASET` updated; re-embed vectors on changes.
- Consider migrating `MemoryVectorStore` to FAISS/Chroma for persistence.
- Keep env values and thresholds (`RAG_TOP_K`, `RAG_SIMILARITY_THRESHOLD`) in sync with observed traffic.

## 18.10 Appendix (Cross-References)
- Retrieval details: `docs/playbooks/RETRIEVAL_PLAYBOOK.md`.
- Intent detector dataset and TS setup: `docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md`.

## 19. Evaluation of Intent Detector

This section describes how to run and interpret the intent classifier evaluation.

### 19.1 Dataset
- Source file: `tests/intent_eval.csv`
- Format: `query,expected_intent` (no extra commas inside `query`)
- Ensure balanced coverage across the taxonomy (retrieval_core, role_fit, logistics, process, assets, compliance, conversational)

### 19.2 Run
- Make sure your `.env` includes `OPENAI_API_KEY`
- Execute:
  - `npx tsx scripts/eval_intents.ts tests/intent_eval.csv`

### 19.3 Metrics
- `accuracy`: overall ratio of correct predictions
- `macroF1`: unweighted F1 averaged across labels; more robust to class imbalance
- Target (initial): `macroF1 >= 0.70`

### 19.4 Maintenance
- Expand `lib/intent/dataset.ts` with new `example_utterances` from real traffic
- After dataset updates, re-run the evaluation and re-embed vectors (restart server to clear the in-memory store)
- Keep `tests/intent_eval.csv` in sync with taxonomy changes

### 19.5 Troubleshooting
- Low macroF1 → add more examples to underperforming intents (short, specific, PL/EN mix)
- Frequent `clarification` predictions → consider threshold tuning (Section 18.3) or add examples near decision boundaries

<!-- CASCADE_APPEND_TARGET -->
