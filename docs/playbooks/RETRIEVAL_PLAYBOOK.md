# Retrieval Playbook

This playbook focuses on improving recall and precision for the conversational RAG system.

## Dynamic Thresholding
- Adapt threshold based on top-1 similarity after boosts.
- Policy:
  - top1 ≥ 0.80 → threshold = max(base, top1 - 0.10)
  - 0.65 ≤ top1 < 0.80 → threshold = max(0.60, base - 0.05)
  - top1 < 0.65 → threshold = max(0.50, min(base, 0.55)); mark low-confidence.

## Intent-Based Boosts
- Detect intent: competencies, leadership, experience, case_study.
- Apply metadata boosts:
  - competencies → +0.15 for `bio` and +0.15 for `leadership`.
  - leadership → +0.20 for `leadership`.
  - experience → +0.15 for `experience`.
  - case_study → +0.20 for `case_study`.
- Optional keyword boosts: design systems, AI/RAG/LLM/MCP.

## Query Expansion
- Expand the user question to 2–4 variants based on intent synonyms.
- Compute embeddings per variant; combine similarity (max or mean) before ranking.

## MMR (Maximal Marginal Relevance)
- Greedy selection over ranked list to reduce redundancy.
- Penalize candidates very similar (cosine ≥ 0.90) to already selected chunks.

## Fallbacks
- If nothing crosses threshold → take topK after boosts; set low-confidence.
- Always include 1 canonical chunk (e.g., `bio` or `leadership`) for competencies/leadership queries.

## Top-K and Threshold ENV
- `RAG_TOP_K=7` suggested.
- `RAG_SIMILARITY_THRESHOLD=0.60` suggested.

## Streaming (Optional)
- Migrate `/api/rag/query` to streaming SSE via AI Gateway OpenAI-compatible API.

## Using Detected Intents

When the chat pipeline detects an intent in `retrieval_core.*`, apply the following in order before final ranking:

1) Intent-Based Boosts
- `competencies` → +0.15 to metadata `bio` and +0.15 to `leadership`.
- `leadership` → +0.20 to `leadership`.
- `experience` → +0.15 to `experience`.
- `case_study` → +0.20 to `case_study`.
- Optional keyword boosts: design systems, AI/RAG/LLM/MCP.

2) Query Expansion
- Generate 2–4 paraphrases using synonyms grounded in the intent's `example_utterances` (see intent catalog).
- Embed each variant; combine scores (max or mean) before ranking.

3) MMR (Diversity Control)
- Greedy selection over ranked list; penalize candidates highly similar (cosine ≥ 0.90) to already selected chunks.

4) Dynamic Thresholding
- Adjust the acceptance threshold based on the boosted top‑1 similarity:
  - top1 ≥ 0.80 → threshold = max(base, top1 − 0.10)
  - 0.65 ≤ top1 < 0.80 → threshold = max(0.60, base − 0.05)
  - top1 < 0.65 → threshold = max(0.50, min(base, 0.55)); mark low‑confidence.

5) Fallbacks
- If nothing crosses threshold, take boosted top‑K, label the result as low‑confidence, and include one canonical chunk for competencies/leadership.

## Cross-References
- Intent taxonomy and dataset, TS classifier, and structured prompt:
  - `docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md`
- Chat runbook (step‑by‑step orchestration and routing rules):
  - `docs/CONVERSATIONAL_RAG.md` (Section 18)

<!-- CASCADE_APPEND_TARGET -->
