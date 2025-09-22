# AUI Task DAG (Dependencies & Parallelization)

Status: Draft (for review)
Last updated: 2025-09-22

This document provides a high-level DAG for executing the AUI workstreams (A–K). It identifies critical dependencies and where tasks can run in parallel.

## Diagram (Mermaid)
```mermaid
graph LR
  %% Workstream A — Routing & Canonicalization
  A1[T1 Routing 301] --> A3[T3 Brand SSR + runtime industry]
  A2[T2 Blacklist] --> A4[T4 SEO canonical & sitemap]
  A1 --> A4
  A3 --> A4
  A5[T5 Legal disclaimers]

  %% Workstream B — Telemetry & Signals (+ Consent C)
  B1[T6 Telemetry schema] --> C1
  C1[T12 Consent gating] --> B2[T7 Page view & dwell]
  C1 --> B3[T8 Scroll depth/velocity]
  C1 --> B4[T9 CTA clicks]
  C1 --> B5[T10 Hesitation/Rage/Dead]
  B1 --> B6[T11 RAG telemetry]
  C1 --> B6

  %% Workstream D/E — Decision + Micro-adaptations
  B1 --> D1[T14 Rules engine (minimal)]
  C1 --> D1
  D1 --> E1[T16 Tooltip]
  D1 --> E2[T17 Suggested queries]
  D1 --> E3[T18 Progressive disclosure]
  E1 --> D2[T15 3 rules wired]
  E2 --> D2
  E3 --> D2
  B2 --> D2
  B5 --> D2
  J2 --> D2

  %% Workstream F — Admin & Governance
  A1 --> F1[T19 Redirects Dashboard]
  B2 --> F1
  B3 --> F1
  B4 --> F1
  B5 --> F1
  H1 --> F2[T20 Mapping management]
  A3 --> F2
  F1 --> F3[T21 Locks & disclaimers toggles]

  %% Workstream G — Experimentation
  A3 --> G1[T22 SSR A/B flags]
  B1 --> G1
  G1 --> G2[T23 First SSR A/B]
  B4 --> G2

  %% Workstream H — AI/LLM
  A3 --> H1[T24 LLM industry classifier (active)]
  B2 --> H2[T25 Session interpreter (shadow)]
  B3 --> H2
  B4 --> H2
  B5 --> H2
  H2 --> H3[T26 Promote safe actions]
  D1 --> H3
  J2 --> H3

  %% Workstream I — Perf, Security, A11y
  I1[T27 Perf budgets/monitoring]
  A1 --> I2[T28 Subdomain regex + rate-limit]
  A3 --> I3[T29 Accessibility AA]
  E1 --> I3
  E2 --> I3
  E3 --> I3

  %% Workstream J — Docs & Rollback
  J1[T30 Dev docs & runbooks]
  J2[T31 Kill-switch & rollback]

  %% Workstream K — Campaigns & Theming (MDX)
  A3 --> K1[T32 MDX loader]
  A3 --> K2[T33 Industry theme tokens]
  K1 --> K3[T34 Campaign renderer + routing]
  K2 --> K3
  K3 --> K4[T35 T‑Mobile MDX]
```

## Critical path
- A1 → A3 → H1 → F2 (routing → brand SSR + runtime industry → LLM classifier active → mapping admin view).
- B1 → C1 → B2/B5 → D1 → E1/E2/E3 → D2 (telemetry → consent → signals → rules engine → micro components → first rules live).
- A3 → K1/K2 → K3 → K4 (brand SSR → MDX loader + theme → campaign renderer → T‑Mobile MDX).
- J2 (kill‑switch) before D2/H3 activations.

## Recommended parallelization
- Foundation: A1, A2, I1, A5 in parallel; then A3.
- Telemetry: B1 → C1, then B2–B5 in parallel; B6 after B1/C1.
- Decision/Micro: D1; then E1–E3 in parallel; D2 after E* and signals.
- Admin: F1 after B2–B5; F3 after F1; F2 after H1/A3.
- Experiments: G1 after A3/B1; G2 after G1.
- AI: H2 (shadow) after B2–B5; H3 after H2/D1/J2.
- MDX: K1 and K2 in parallel after A3; K3 after K1/K2; K4 after K3.

## Notes
- All behavioral analytics are consent‑gated (see Consent vs Signal Matrix).
- Subdomains follow default‑allow and 301 to canonical brand route.
- No unapproved logos; textual disclaimers available.
