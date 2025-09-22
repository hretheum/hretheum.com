# Industry Classifier: Runtime, Debugging, and Governance

Status: Draft (for review)
Last updated: 2025-09-22

This document explains how industry classification runs at request time, how to debug it, and what safeguards are in place.

## Runtime resolution flow (SSR)
- Entry: `app/brand/[slug]/page.tsx` enforces per‑request SSR (`runtime='nodejs'`, `dynamic='force-dynamic'`, `revalidate=0`).
- Server logic: `lib/industry_server.ts` → `resolveIndustrySSR(slug)` follows:
  1) Deterministic mapping from `data/brand_industries.json` (persisted to DB with `status=manual`, `updated_by=deterministic`).
  2) DB mapping (`brand_industries`), supports `auto/manual/locked`.
  3) LLM fallback: constrained classes from `getAllowedIndustries()` (includes `eLearning`, `Telecom`). Suggestions are always inserted into `brand_industry_suggestions`.
- Telemetry: one row in `industry_resolution_events` per request.

## LLM specifics
- Client: `lib/llm.ts` with gateway/direct support.
  - Use `AI_GATEWAY_API_KEY` by default.
  - Set `INDUSTRY_FORCE_OPENAI=true` to bypass gateway and use `OPENAI_API_KEY` directly.
- Model fallback and parsing hardening:
  - Tries candidate models in order: `AI_MODEL_GENERATION`, `gpt-4o-mini`, `gpt-4o`, `o4-mini`, `gpt-4.1-mini`.
  - Enforces JSON first; retry without `response_format` if needed; strips code fences; regex fallback.
- Normalization & synonyms:
  - Maps common variants to allowed classes (e.g., `retail`→`Commerce`, `edtech`→`eLearning`, `telecommunications|telco|carrier|isp|wireless|5g`→`Telecom`).

## Environment variables
- `INDUSTRY_LOG=debug` — verbose logs `[industry]` with raw model text and decision stages.
- `INDUSTRY_LLM_TIMEOUT_MS=20000` — request timeout (ms).
- `AI_MODEL_GENERATION` — preferred model id.
- `AI_GATEWAY_API_KEY` and/or `OPENAI_API_KEY` — LLM credentials.
- `INDUSTRY_FORCE_OPENAI=true` — bypass gateway.
- `INDUSTRY_AUTOPROMOTE_ENABLED=true|false` — enable/disable DB autopromotion from LLM suggestions.
- `INDUSTRY_AUTOPROMOTE_MIN_CONF=0.8` — confidence threshold for autopromotion.
- `SUPABASE_SERVICE_ROLE_KEY` — required for inserts into suggestions/mapping/events tables.
- `INDUSTRY_DEBUG_SECRET` — required for debug endpoint access.

## Debug endpoint
- `GET /api/admin/industry/debug?slug=<brand>&secret=<INDUSTRY_DEBUG_SECRET>`
- Response:
```json
{
  "ok": true,
  "result": { "industry": "Telecom", "source": "llm", "confidence": 0.86 },
  "meta": {
    "hasGatewayKey": true,
    "hasOpenAIKey": true,
    "hasSvcKey": true,
    "timeout": 20000,
    "autopromoteEnabled": true,
    "minConf": 0.8,
    "log": "debug"
  }
}
```

## Database tables (Supabase)
- `brand_industries(brand_slug, industry, status, updated_by, updated_at, note)`
- `brand_industry_suggestions(id, created_at, brand_slug, industry, confidence, source, dismissed, expires_at)`
- `industry_resolution_events(id, created_at, brand_slug, source, industry, confidence, note)`

## Governance
- No unapproved logos; neutral copy and disclaimers available.
- Deterministic mappings are persisted (`status=manual`) for auditability.
- LLM suggestions logged regardless of autopromotion threshold for human review.
