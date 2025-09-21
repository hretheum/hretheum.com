# Adaptive UI (AUI) Roadmap for hretheum-bolt

Last updated: 2025-09-21
Status: Draft (for review)

## 1) Executive Summary
- Default-allow policy for employer-oriented subdomains: any `<brand>.hretheum.com` is treated as a campaign entry unless blacklisted.
- Canonicalization: 301 redirect from subdomains to `https://hretheum.com/brand/<slug>` (if slug validation fails, redirect to `https://hretheum.com/brand`).
- SSR for above-the-fold personalization (hero, headline, CTA, module order) to avoid flicker; CSR for in-session micro-adaptations (tooltips on hesitation, suggested queries, progressive disclosure).
- Unified telemetry (including RAG): brand and campaign metadata emitted consistently for cohort analytics.
- Privacy, SEO, security and performance guardrails baked in from day one.

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

## 7) RAG Integration
- Inputs: add `brand` (and derived `industry`) to RAG telemetry and optional retrieval boosts.
- Retrieval: apply light industry/brand boost while maintaining MMR to avoid filter bubbles; keep dynamic thresholding.
- Telemetry (augment existing): `brand`, `campaign_source`, `campaign_type`, `variant_id`, alongside `msg`, `intent`, `confidence`, `selectedCount`, `top1Boosted`, `lowConfidence`.

## 8) Content Generation Strategy (Safe-by-default)
- Brand→industry mapping:
  - Layer 1: maintained dictionary (e.g., `zendesk`→`SaaS/support`, `bayer`→`Pharma/regulated`).
  - Layer 2 (fallback): constrained LLM classification: select from a closed set `{SaaS, Pharma, FinTech, Commerce, Manufacturing, Public}`.
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
- `/brand/<slug>`: enable ISR with short revalidation for auto-generated content; prerender top brands.
- CSR micro-adaptations: keep light; no heavy third-party scripts.
- Guardrails: monitor LCP/CLS/INP; no client-side flicker.

## 13) Rollout Plan (Phased)
- Phase 1 (Foundation)
  - Routing: default-allow, blacklist, 301 to `/brand/<slug>`; canonical setup.
  - SSR hero/CTA using industry templates; baseline telemetry per brand.
- Phase 2 (Micro-adaptations & Admin)
  - CSR hesitation tooltips; RAG suggested queries per brand/industry.
  - Admin read-only dashboard for brand cohorts and mapping.
- Phase 3 (AI Assist, Shadow Mode)
  - LLM-based brand→industry classification (constrained); generate safe templated copy; mark `needs-review`.
  - Compare AI suggestions with rules; lock high-traffic brands.
- Phase 4 (Optimization)
  - A/B test hero/CTA per brand; RAG retrieval boosts; iterate on metrics.

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

<!-- CASCADE_APPEND_TARGET -->  
