# Adaptive UI (AUI) Roadmap for hretheum-bolt

Last updated: 2025-09-22
Status: Draft (for review)

 See also: [AUI Task DAG](./AUI_DAG.md).

## 1) Executive Summary
- Default-allow policy for employer-oriented subdomains: any `<brand>.hretheum.com` is treated as a campaign entry unless blacklisted.
- Canonicalization: 301 redirect from subdomains to `https://hretheum.com/brand/<slug>` (if slug validation fails, redirect to `https://hretheum.com/brand`).
- SSR for above-the-fold personalization (hero, headline, CTA, module order) to avoid flicker; CSR for in-session micro-adaptations (tooltips on hesitation, suggested queries, progressive disclosure).
- Unified telemetry (including RAG): brand and campaign metadata emitted consistently for cohort analytics.
- Privacy, SEO, security and performance guardrails baked in from day one.
- Campaign-first MDX support: when a brand has an active MDX campaign, we render campaign content with reusable components; otherwise we fall back to industry-first generic content using the same components and industry theme tokens.
- Runtime industry resolution on brand routes: deterministic JSON mapping → DB mapping → LLM classifier (constrained) with debug endpoint and autopromotion guardrails.

## 2) Objectives & Non-goals
- Objectives
  - Deliver brand-aware experiences with minimal manual setup via default-allow subdomains and canonical brand routes.
  - Improve engagement and conversion for campaign traffic while preserving Core Web Vitals and SEO.
  - Standardize behavioral signals and decision logic to bootstrap AUI with a hybrid rules + AI approach.
- Non-goals
  - No usage of unapproved brand assets/logos.
  - No heavy client-side personalization that degrades CWV.
  - No full auto-publish without review for high-traffic brands (we allow locks in Admin).

## 3) Scope
- In-scope: routing & canonicalization, brand detection, SSR/CSR adaptations, RAG integration, telemetry, admin visibility, SEO/privacy/security guardrails.
- Out-of-scope (initially): custom per-brand design systems, deep CRM enrichment, bespoke flows per employer beyond industry templates.

## 4) Routing & Canonicalization Policy
- Default-allow: treat any `<brand>.hretheum.com` as campaign traffic, except blacklisted subdomains.
- Blacklist (examples): `www`, `app`, `admin`, `api`, `auth`, `static`, `cdn`, `assets`, `img`, `mail`, `ftp`, `m`, `stage`, `dev` (reserved/system/malicious).
- 301 Redirect: subdomain host → `https://hretheum.com/brand/<slug>` (or `/brand` when slug invalid/missing). This ensures a single canonical indexable location.
- Canonical tag: `/brand/<slug>` is self-canonical. Subdomains use 301, so no separate indexing is expected.
- Host normalization & slug policy:
  - Lowercase; characters `[a-z0-9-]{1,63}`; collapse multiple dashes; trim leading/trailing dashes.
  - Disallow IDN/punycode; ignore prefixes like `www-`.
- Example flows:
  - `zendesk.hretheum.com` → 301 → `https://hretheum.com/brand/zendesk`
  - `bayer.hretheum.com` → 301 → `https://hretheum.com/brand/bayer`
  - `WWW.hretheum.com` or `admin.hretheum.com` → blocked/ignored (blacklist) → fallback neutral route.

## 5) Brand Detection & Context Lifetime
- Extract `<brand>` from subdomain using strict regex, normalize to `<slug>`.
- Set in request/session context: `campaign_type=employer-subdomain`, `campaign_source=subdomain`, `brand=<slug>`.
- Context lifetime: valid for current session; cleared on sign-out and when leaving brand routes.
- Middleware responsibility: light parsing and validation only; heavy rendering handled in route components.

## 6) AUI Decisioning & Experiences
- Rule priority: `brand` > referrer/utm > user proficiency (Novice/Intermediate/Power).
- SSR (above-the-fold):
  - Hero headline/subheadline, CTA text and placement, module order.
  - Navigation pre-highlights to the most relevant sections for the brand/industry.
- CSR (in-session micro-adaptations):
  - Tooltips on `hesitation > 2s` over CTA (brand-aware micro-copy).
  - Suggested queries in RAG UI based on `brand`/industry, especially when `intent_confidence < INTENT_THRESHOLD`.
  - Progressive disclosure: simpler onboarding for Novice; shortcuts for Power users.
- Example If–Then rules:
  - If `brand=zendesk` then `hero_variant=zendesk_support_ops`, `cta=Book support-focused demo`.
  - If `brand=bayer` then `hero_variant=regulated_envs`, `cta=See how we deliver in regulated environments`.
  - If `intent_confidence < threshold` then show 3 brand-aware suggested queries.
  - If `hesitation>2s` on brand CTA then show tooltip with brand-specific reassurance.

### 6.1) Industry themes and brand overrides
- Each industry provides theme tokens: `accent`, `gradientFrom/Via/To`, `headlineCase`, `slashAngle`, `slashOffsetY`, `captionStyle`, `ctaVariantPrimary`.
- Campaign MDX may override selected tokens (e.g., `accent: #e20074` for T‑Mobile magenta) while preserving industry defaults elsewhere.
- All campaign and generic surfaces share the same components, styled via the current theme.

## 7) RAG Integration
- Inputs: add `brand` (and derived `industry`) to RAG telemetry and optional retrieval boosts.
- Retrieval: apply light industry/brand boost while maintaining MMR to avoid filter bubbles; keep dynamic thresholding.
- Telemetry (augment existing): `brand`, `campaign_source`, `campaign_type`, `variant_id`, alongside `msg`, `intent`, `confidence`, `selectedCount`, `top1Boosted`, `lowConfidence`.

## 8) Content Generation Strategy (Safe-by-default)
- Brand→industry mapping:
  - Layer 1: maintained dictionary in `data/brand_industries.json`.
  - Layer 2: DB mapping (manual/auto/locked) visible in Admin.
  - Layer 3 (runtime): constrained LLM classification from a closed set `{SaaS, Pharma, FinTech, Commerce, Manufacturing, Public, eLearning, Telecom, Generic}` with timeouts, model fallback and strict parsing; suggestions are always stored; optional autopromote above a confidence threshold; debug endpoint `/api/admin/industry/debug`.
- Templates per industry:
  - Predefined hero/CTA copy and module ordering; no use of trademark assets; neutral wording (“for <Brand>-like environments”).
- Governance:
  - Admin flags: `auto-generated`, `needs-review`, `locked` for high-traffic brands.
  - Disclaimer: textual references only unless explicit approval is stored.

## 9) Admin & Telemetry Visibility
- Admin UI: view per-brand cohorts (CTR hero, dwell, conversion, rage/dead clicks, RAG reformulations), expose brand/industry mapping, and lock reviewed content.
- Event schema: ensure `brand`, `campaign_source=subdomain`, `campaign_type=employer-subdomain`, and `variant_id` are present on both FE and `app/api/rag/query/route.ts` events.

## 10) SEO & Indexation
- Single canonical per brand: `/brand/<slug>`.
- Subdomains: always 301 to canonical; no separate sitemaps for subdomains.
- Sitemaps: live at apex domain only.
- Avoid duplicate content: light template variance per industry; self-canonical at the brand route.

## 11) Security & Privacy Guardrails
- Strict subdomain validation; blacklist reserved words; reject IDN/punycode; rate-limit unknown high-churn brands.
- Headers: trust `x-forwarded-host` only behind trusted infra; otherwise use server host.
- Cookies/session: prefer request/session-scoped brand context; avoid long-lived cross-subdomain cookies.
- Privacy: consent required for behavioral tracking beyond routing-based personalization; graceful degradation on deny.
- Legal: neutral textual references; disclaimers; no unapproved logos.

## 12) Performance & Caching
- SSR edge/middleware minimal: parse/validate only.
- `/brand/<slug>`: runtime SSR enforced (`runtime='nodejs'`, `dynamic='force-dynamic'`, `revalidate=0`) so LLM classification and mappings run per-request.
- CSR micro-adaptations: keep light; no heavy third-party scripts.
- Guardrails: monitor LCP/CLS/INP; no client-side flicker.

## 13) Rollout Plan (Phased)
- Phase 1 (Foundation)
  - Routing: default-allow, blacklist, 301 to `/brand/<slug>`; canonical setup.
  - SSR hero using industry templates; baseline telemetry per brand; runtime industry resolution with LLM shadow → active.
- Phase 2 (Micro-adaptations & Admin)
  - CSR hesitation tooltips; RAG suggested queries per brand/industry.
  - Admin read-only dashboard for brand cohorts and mapping; industry debug endpoint.
- Phase 3 (AI Assist, Shadow Mode)
  - LLM-based brand→industry classification (constrained) — implemented active with suggestions/autopromote; generate safe templated copy; mark `needs-review` where applicable.
  - Compare AI suggestions with rules; lock high-traffic brands.
- Phase 4 (Optimization)
  - A/B test hero/CTA per brand; RAG retrieval boosts; iterate on metrics.

## 13a) Campaigns MDX
- Brands with active campaigns render MDX content with reusable components; brands without campaigns render generic industry-adaptive content.
- See `docs/aui/CAMPAIGNS_MDX.md` for full architecture and examples.

## 14) Metrics & Success Criteria
- Task success: time-to-first-value in RAG; completion rate of key actions.
- Engagement: hero CTR, dwell in key sections, scroll depth.
- Quality: reduction in rage/dead clicks; fewer query reformulations in RAG.
- Business: conversion to schedule/sign-up (as applicable).
- Guardrails: no SEO regression; stable/improved CWV.

## 15) Risks & Mitigations
- Over-personalization/brand misuse → neutral templates + disclaimers + admin locks.
- SEO duplication → strict 301 to `/brand/<slug>` + canonical consistency.
- Performance regressions → SSR above-the-fold, light CSR, continuous CWV monitoring.
- Security/abuse via subdomains → regex validation, blacklist, rate-limiting.

## 16) Open Questions
- Final list of reserved subdomains (blacklist)?
- Industry set and initial brand→industry mapping?
- Exact disclaimer wording and legal policy for brand mentions?

## 17) Appendix
- Regex: `^[a-z0-9-]{1,63}$` (lowercase; collapse multiple dashes; trim edges).
- Initial blacklist (suggested): `www`, `app`, `admin`, `api`, `auth`, `static`, `cdn`, `assets`, `img`, `mail`, `ftp`, `m`, `stage`, `dev`.
- Example suggested queries (samples):
  - Zendesk (SaaS/support): `ticket routing optimization`, `self-service deflection`, `improving CSAT`, `reducing time-to-resolution`.
  - Bayer (Pharma/regulated): `validation workflow`, `compliance evidence generation`, `data governance`, `risk controls for regulated environments`.

## 18) Behavioral Signals Layer (Site-wide)
- **Core engagement signals**
  - `nav.view` (page view with route), `nav.path` (sequence), `dwell.time` (per route/section), `ui.click` (CTA id), `form.submit` (anonymized outcome), `user.returning`.
- **Context signals**
  - Device (UA/Client Hints), viewport, locale, time-of-day, referrer/UTM, approximate geo (country), auth state.
- **Advanced micro-behaviors**
  - `ui.hesitation` (hover/focus >2s on actionable), `ui.rage_clicks` (>3 rapid clicks on same target), `ui.dead_click` (click on non-interactive), `nav.scroll` (depth 0.25/0.5/0.75/0.9), `scroll.velocity` (px/s buckets).
- **RAG/intent signals**
  - `rag.query` { msg, intent, confidence, expansions }, `rag.response` { selectedCount, top1Boosted, lowConfidence }.
- **Signal policy**
  - First‑party only, consent‑gated for behavioral analytics; minimal PII; sample rates configurable; SSR-friendly defaults.

## 19) MVP AUI (Signals + Minimal Rules)
- **Scope (initial)**
  - `app/page.tsx` (Home), `/brand/[slug]` (Brand), RAG UI component, key CTA sections/forms.
- **Instrumentation (minimum viable)**
  - Emit: page view, dwell, scroll depth, CTA clicks, hesitation on CTA, rage clicks, RAG intent/confidence.
- **Light segmentation**
  - `proficiency`: Novice / Intermediate / Power (based on visits, dwell, feature usage),
  - `campaign`: brand (from canonical route), referrer/utm.
- **Initial rules (examples)**
  - If `intent_confidence < INTENT_THRESHOLD` → show 3 suggested queries (brand/industry aware).
  - If `hesitation > 2s` on primary CTA → show reassurance tooltip (contextual micro‑copy).
  - If `proficiency = Novice` → enable progressive disclosure (collapse advanced blocks, show How‑it‑works).
  - If `scroll.velocity` is very fast and `dwell.time` low → compress content above fold (hide non‑essential modules).
  - If repeated `rag.query` reformulations in short window → offer guided mode (chips/filters).

## 20) Decision Layer Architecture (Hybrid)
- **Principles**
  - Rules for critical, predictable flows (onboarding, key CTAs, legal/consent); AI for nuanced optimization.
  - SSR for structural, above‑the‑fold changes; CSR for micro‑adaptations in-session.
- **Rule engine (concept)**
  - Declarative conditions → actions with priorities and guards.
```json
{
  "rules": [
    {
      "id": "low_conf_suggestions",
      "when": { "rag.intent_confidence": { "lt": 0.44 } },
      "then": [ { "action": "ui.show_suggestions", "params": { "count": 3, "source": "brand_or_industry" } } ],
      "priority": 90, "scope": "RAG"
    },
    {
      "id": "cta_hesitation_tooltip",
      "when": { "ui.hesitation": { "target": "primary_cta", "gt_ms": 2000 } },
      "then": [ { "action": "ui.tooltip", "params": { "target": "primary_cta", "copy": "brand_aware" } } ],
      "priority": 80, "scope": "CSR"
    }
  ],
  "defaults": { "fallback_variant": "neutral" }
}
```
- **Evaluation**
  - Precedence: critical rules > campaign/brand > proficiency > experimental.
  - Deterministic ordering; idempotent actions; safe fallbacks.

### 20a) LLM Policy Engine (shadow→active)
- Inputs (session summary, PII‑safe): route, brand/industry, consent, device; recent `nav.view`, `dwell.time`, `nav.scroll` (depth/velocity), `ui.hesitation/rage/dead`, CTA clicks; optional RAG `intent/confidence`.
- Allowed actions (allowlist): `ui.show_suggestions` (≤5), `ui.tooltip` (primary CTA), `ui.compress_above_fold`, `ui.show_how_it_works`, `ui.emphasize_case_studies`.
- API (CSR): `POST /api/decision/policy` → `{ recommended_action, confidence, intent_summary }` with strict JSON schema, timeout, retries, cost caps.
- Precedence & aggregation: hard rules (consent/legal/security; SSR above‑the‑fold) override AI; AI is suggestive with per‑session caps and idempotency.
- Feature flags: `NEXT_PUBLIC_RULES_AI_ENABLED`, `RULES_AI_SHADOW_ONLY`, `RULES_AI_TIMEOUT_MS`, `RULES_AI_SAMPLE_RATE`, `RULES_AI_ALLOWED_ACTIONS`.
- Guardrails: strict parsing, allowlist only, sampling & rate limits, no raw PII in prompts, debug logs behind flag, latency/cost budgets.
 - See also: T14 implementation plan (`docs/aui/T14-rules-engine-plan.md`).

## 21) LLM Interpretation (Phase 2, Shadow → Active)
- **Goal**: human‑like interpretation of session signals to infer short‑term intent and propose UI variant.
- **Inputs (summarized)**: recent `nav.view`, `dwell`, `scroll`, `ui.hesitation/rage`, latest `rag.query/response`, `brand/industry`.
- **Prompt (example)**
```text
You are an analyst. Given the session log (concise JSON) for a visitor on hretheum.com, infer the most likely intent and recommend one UI adjustment from the allowed list.
- Allowed actions: show_suggestions, compress_above_fold, show_how_it_works, emphasize_case_studies.
- Return JSON with { intent_summary, recommended_action, confidence }.
```
- **Mode**: Shadow first (log recommendations, no effect), compare vs rules; then allow low‑risk actions under thresholds and rate limits.
- Flags: `NEXT_PUBLIC_RULES_AI_ENABLED`, `RULES_AI_SHADOW_ONLY`, `RULES_AI_TIMEOUT_MS`, `RULES_AI_SAMPLE_RATE`, `RULES_AI_ALLOWED_ACTIONS`.
- **Guardrails**: constrained action set, cost caps, timeouts, privacy filters (no raw PII in prompts).

## 22) Data & Telemetry Schema (Concept)
- **Common fields**: `ts`, `session_id`, `anon_user_id`, `route`, `brand`, `campaign_source`, `campaign_type`, `device`, `viewport`, `locale`, `referrer`, `consent`.
- **Events**
  - `nav.view` { route }
  - `dwell.time` { route, ms }
  - `nav.scroll` { route, depth_bucket, velocity_bucket }
  - `ui.click` { target_id }
  - `ui.hesitation` { target_id, ms }
  - `ui.rage_clicks` { target_id, count, window_ms }
  - `form.submit` { form_id, status }
  - `rag.query` { msg_hash, intent, confidence, expansions }
  - `rag.response` { selectedCount, top1Boosted, lowConfidence }
- **Storage**: first‑party (e.g., Supabase/Amplitude/Mixpanel); retention policies; export for analysis; PII minimization.

## 23) Consent & Privacy Handling
- **Consent gating**: without consent, only strictly necessary routing/context; disable micro‑behavior tracking; degrade AUI to SSR-only basics.
- **Minimization**: no sensitive categories; hash textual inputs where feasible; short retention; DSAR support.
- **Transparency**: clear copy on what/why; easy opt‑out; respect DNT where applicable.

## 24) Experimentation Plan
- **A/B & MVT**: server‑side flags for SSR variants; client‑side light toggles for CSR actions.
- **KPIs**: time‑to‑first‑value (RAG), hero CTR, conversion, rage/dead clicks reduction, reformulation rate.
- **Process**: hypothesis → design → small ramp → analyze → decide; avoid overlapping experiments on same surface.

## 25) Rollout Checklist per Page/Surface
- **Instrumentation**: page view, dwell, scroll depth, key CTAs, hesitation targets.
- **Decisions wired**: confirm rule evaluation order and fallbacks.
- **Consent paths**: verify degradation on deny.
- **Telemetry QA**: event schemas, sampling, dashboards.
- **Performance**: LCP/CLS/INP budgets met; no flicker.

## 26) Glossary
- **AUI**: Adaptive User Interface.
- **CSR/SSR**: Client/Server-side rendering.
- **MMR**: Maximal Marginal Relevance (retrieval diversification).
- **Hesitation/Rage clicks**: micro-behaviors indicating friction.
