# Conversational RAG Assistant for Recruiters

## 1. Goal & Scope
- Purpose: Provide a conversational assistant that answers recruiter-style questions about Eryk's competencies, experience, leadership approach, and case studies using natural language.
- Scope (MVP):
  - Ingestion from local Markdown files under `data/rag/`.
  - Local vector store (JSON) for embeddings and metadata.
  - Retrieval-Augmented Generation (RAG) API route returning answer + citations (quotes + links to portfolio sections).
  - Minimal sticky-bottom chat widget in the UI.
  - Cheap default model via Vercel AI Gateway with easy runtime switch.
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
- Frontend: Next.js client component for sticky chat (bottom dock), streaming responses, rendering citations.
- Backend: Next.js Route Handlers.
  - `/api/rag/ingest` – parse MD → chunk → embed → write `data/index.json` (vectors + metadata).
  - `/api/rag/query` – embed query → KNN search → prompt compose → stream answer with sources.
- Vector Store (MVP): JSON file `data/index.json` with fields: `id`, `text`, `embedding`, `metadata`.
- Future Store: Vercel Postgres + pgvector.
- AI Gateway:
  - Embeddings and generation routed via provider aliases.
  - Default cheap model alias env: `AI_MODEL_GENERATION=provider:cheap-default`.
  - Default embeddings alias env: `AI_MODEL_EMBEDDINGS=provider:embed-default`.

## 5. Chunking & Metadata
- Chunk size: 500–1000 tokens, overlap 100–150.
- Strategy: break on headings/paragraphs; keep semantic boundaries.
- Metadata fields:
  - `source_type` (competency | leadership | case_study | bio | faq)
  - `source_name` (e.g., "ING Onboarding DS")
  - `role` (e.g., Head of Design)
  - `tech` (e.g., Figma, React, Tailwind, pgvector)
  - `date` (ISO, optional)
  - `link` (deep link to portfolio section)

## 6. Retrieval & Reranking
- Retrieval: cosine similarity over normalized embeddings; take top-k (k=5).
- Optional reranking: light MMR or in-prompt reordering based on coverage + diversity.
- Filters/Boosting: optional topic filters (competencies/experience/leadership) to boost relevant chunks.

## 7. Prompting & Answer Format
- System Prompt (summary):
  - "You are Eryk's recruiting assistant. Answer concisely with a professional, narrative tone. Use only provided sources. If insufficient evidence, say so and suggest next steps or a link to contact. Always include Citations with exact quotes and links."
- Output contract (JSON streamed or structured blocks):
  - `answer`: markdown string
  - `citations`: list of `{quote, source_name, link}`
- Safety behavior: abstain if low similarity or conflicting info; avoid speculation.

## 8. Guardrails
- Input moderation (toxicity/NSFW); denylist for certain topics.
- Knowledge boundaries: explicit "I don't have enough information" path.
- Tone control: professional, narrative, no exaggerations.
- Logging PII: do not persist user queries beyond anonymous analytics.

## 9. Quality Gates
- Answer accuracy against ground-truth MD.
- Faithfulness: quoted text must appear in sources.
- Coverage: key thematic areas covered by eval set.
- Hallucination rate below defined threshold.
- Latency SLO (p95 < 2.5s for typical queries with cache warm).
- Cost budget per 100 queries.

## 10. Definition of Done (DoD)
- Docs and environment variables prepared (`AI_MODEL_GENERATION`, `AI_MODEL_EMBEDDINGS`).
- Ingestion route can index at least 3 MD files into `data/index.json`.
- Query route returns streamed answer with at least 2 citations.
- Sticky chat UI integrated and functional on desktop and mobile.
- Guardrails (moderation + abstain path) enabled.
- Basic analytics via Vercel AI Gateway metrics.
- `.vercelignore` excludes `docs/` from deploy uploads.

## 11. Metrics of Success
- Content satisfaction (thumbs up/down rate ≥ 80% positive).
- CTR to portfolio sections from answers ≥ 20%.
- Session time on Q&A ≥ 2 min average for engaged users.
- Abstain rate within 5–15% (healthy boundary signaling).
- Cost per 100 queries within target (e.g., <$0.50 for MVP).

## 12. Validation Methods
- Offline eval set: 30–50 questions across competencies/experience/leadership.
- Automated checks: exact-quote verification for citations.
- Human review: weekly spot-check of 10 conversations.
- Canary release: enable for a limited audience; monitor metrics.

## 13. Model & Gateway Strategy
- Default cheap models via Vercel AI Gateway (examples; choose per availability/cost):
  - Generation: small/efficient instruction-tuned (e.g., provider aliases for Llama 3.1 8B Instruct, Qwen 2.5 7B Instruct, or Mixtral 8x7B).
  - Embeddings: economical English embeddings with good recall.
- Hot-swap: switch providers via env vars without code changes.
- Caching: cache system prompts and stable tool instructions in Gateway.

## 14. Branching & Deployment
- Work on a separate branch: `feature/rag-assistant`.
- Commit discipline: small, coherent commits; PR template with checklist.
- The `docs/` folder is versioned in GitHub but excluded from Vercel deployment via `.vercelignore`.
- Ensure the GitHub repository is private.

## 15. Risks & Mitigations
- Risk: Hallucinations → Mitigation: strict citation requirement + abstain.
- Risk: Data sensitivity → Mitigation: redaction policy, review before ingest.
- Risk: Latency/cost spikes → Mitigation: cheap defaults, caching, top-k tuning.
- Risk: Incomplete coverage → Mitigation: extend MD corpus iteratively.

## 16. Roadmap (Post-MVP)
- PDF and web source ingestion.
- Vercel Postgres + pgvector migration.
- Reranking model / LLM-as-a-reranker.
- Analytics dashboard and feedback loop for content improvement.
