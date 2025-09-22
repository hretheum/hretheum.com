# AUI Consent vs Signal Matrix

Last updated: 2025-09-21
Status: Draft (for review)

See also: [AUI Task DAG](./AUI_DAG.md).

This document summarizes which signals we collect with and without user consent. It is a product/engineering guideline, not legal advice. When in doubt, prefer minimization and seek legal review.

Guiding principles
- Minimize by default. Collect only what is necessary for the immediate feature.
- First‑party only for MVP. No third‑party pixels/SDKs by default.
- No fingerprinting. No cross-site tracking. No long-lived tracking IDs without consent.
- Hash/redact textual inputs when logged for diagnostics. Prefer aggregates.
- Short retention, documented DSAR (data subject access request) path.

## Matrix

| Signal / Event | Purpose | Without Consent | With Consent | Lawful Basis (indicative) | Retention (indicative) | Identifiers | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Routing context (host → brand, URL path, canonical 301) | Serve correct SSR variant and canonical route | Allowed | Allowed | Necessary for service / legitimate interest | Not stored beyond request; server logs short | None beyond request metadata | Extract brand from subdomain, perform 301 to `/brand/<slug>` |
| Auth/session cookies (Supabase auth) | Maintain secure session | Allowed | Allowed | Necessary for service | Session lifetime | Session token (HTTP‑only) | Security cookies (CSRF) also allowed |
| Security/server logs (status, UA, timestamp, IP short‑term) | Abuse mitigation, diagnostics | Allowed (minimal) | Allowed | Legitimate interest | 7–30 days; IP shortened/hashed ASAP | Ephemeral request IDs | Rate‑limiting, DDOS detection |
| Server performance metrics (aggregated) | Reliability and SRE | Allowed (aggregated) | Allowed | Legitimate interest | Aggregates only | None persistent per user | No user‑level attribution |
| Preference cookies (locale/theme set by user) | User‑chosen preferences | Allowed | Allowed | Necessary for service | Reasonable (e.g., 6–12 months) | Preference cookie | Only explicit user choices |
| RAG processing of user message (real‑time) | Answer the query | Allowed | Allowed | Necessary for service | In‑memory; logs minimized | None required | Do not persist raw text by default |
| Page view `nav.view` (analytics) | Usage analytics | Not allowed | Allowed | Consent | Up to 13 months | Anon session ID | First‑party emission only |
| Dwell time `dwell.time` | Engagement measurement | Not allowed | Allowed | Consent | Up to 13 months | Anon session ID | Debounced, low overhead |
| Scroll depth/velocity `nav.scroll` | Content engagement | Not allowed | Allowed | Consent | Up to 13 months | Anon session ID | Buckets only (0.25/0.5/0.75/0.9) |
| CTA clicks `ui.click` | Conversion measurement | Not allowed | Allowed | Consent | Up to 13 months | Stable target_id | No PII in IDs |
| Hesitation `ui.hesitation` | Friction detection | Not allowed | Allowed | Consent | Up to 13 months | Anon session ID | Threshold >2s; sample if needed |
| Rage/dead clicks `ui.rage_clicks`/`ui.dead_click` | Friction detection | Not allowed | Allowed | Consent | Up to 13 months | Anon session ID | Windows limited; capped |
| A/B & MVT flags | Experimentation | Not allowed | Allowed | Consent | Per experiment window + 90 days | Anon session ID | Server‑side preferred |
| Cross‑session identifiers | Cohorting/profiling | Not allowed | Allowed | Consent | Minimal and documented | Stable anon ID | Avoid unless needed |
| External analytics SDK/pixels | Vendor dashboards | Not allowed | Allowed (opt‑in) | Consent | Vendor defaults (review) | Vendor SDK IDs | Prefer server‑side forwarding |
| RAG content logging (raw) | Quality analysis | Not allowed by default | Allowed (opt‑in) | Consent | ≤ 7 days; or hash | Msg hash only | Prefer hashing/redaction; limit scope |
| Session replay | UX diagnostics | Not allowed | Allowed (opt‑in) | Consent | Short; minimized scope | Vendor/session IDs | Out‑of‑scope for MVP |

## Retention & Access
- Default retention for analytics with consent: ≤ 13 months. Shorter is preferred.
- Server logs: 7–30 days with IP truncation/hashing and strict access.
- RAG text logs: Avoid storing raw; if necessary for short QA cycles, store hashes for ≤ 7 days.
- DSAR: Provide export and deletion for anon IDs where applicable.

## Implementation Notes
- Consent gating: the front‑end emitter is disabled until consent is granted. Only strictly necessary SSR/routing runs.
- Pseudonymization: use anonymous session IDs (rotating if possible) for analytics; never store PII in event payloads.
- Environment flags: allow quickly disabling categories (analytics, experiments, micro‑behaviors) per environment.

## Ownership
- Engineering: implementation and gating
- Legal: policy review and DSAR process
- Data: retention and dashboarding
