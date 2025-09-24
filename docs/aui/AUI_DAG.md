# AUI Task DAG (Dependencies & Parallelization)

Status: Draft (for review)
Last updated: 2025-09-24

This document provides a high-level DAG for executing the AUI workstreams (A–K). It identifies critical dependencies and where tasks can run in parallel.

## Diagram (Mermaid)

```mermaid
flowchart LR
A1[T1 Routing 301]
A2[T2 Blacklist]
A3[T3 Brand SSR + runtime industry]
A4[T4 SEO canonical and sitemap]
A5[T5 Legal disclaimers]
B1[T6 Telemetry schema]
B2[T7 Page view and dwell]
B3[T8 Scroll depth and velocity]
B4[T9 CTA clicks]
B5[T10 Hesitation Rage Dead]
B6[T11 RAG telemetry]
C1[T12 Consent gating]
D1[T14 Rules engine - minimal]
D2[T15 Three rules wired]
E1[T16 Tooltip]
E2[T17 Suggested queries]
E3[T18 Progressive disclosure]
F1[T19 Redirects Dashboard]
F2[T20 Mapping management]
F3[T21 Locks and disclaimers toggles]
G1[T22 SSR A/B flags]
G2[T23 First SSR A/B]
H1[T24 LLM industry classifier - active]
H2[T25 Session interpreter - shadow]
H3[T26 Promote safe actions]
I1[T27 Perf budgets and monitoring]
I2[T28 Subdomain regex and rate-limit]
I3[T29 Accessibility AA]
J1[T30 Dev docs and runbooks]
J2[T31 Kill-switch and rollback]
K1[T32 MDX loader]
K2[T33 Industry theme tokens]
K3[T34 Campaign renderer and routing]
K4[T35 T-Mobile MDX]
K5[T36 Theme-aware CoverPage (E1)]
K6[T37 Unified Components (E2)]
K7[T38 Frontmatter schema (E3)]
K8[T39 TMOBILE MDX refactor (E4)]
K9[T40 NeonSlash bg (opt)]
K10[T41 CTA override (opt)]
K11[T42 Prose spacing (opt)]

A1 --> A3
A2 --> A4
A1 --> A4
A3 --> A4

B1 --> C1
C1 --> B2
C1 --> B3
C1 --> B4
C1 --> B5
B1 --> B6
C1 --> B6

B1 --> D1
C1 --> D1
D1 --> E1
D1 --> E2
D1 --> E3
E1 --> D2
E2 --> D2
E3 --> D2
B2 --> D2
B5 --> D2
J2 --> D2

A1 --> F1
B2 --> F1
B3 --> F1
B4 --> F1
B5 --> F1
H1 --> F2
A3 --> F2
F1 --> F3

A3 --> G1
B1 --> G1
G1 --> G2
B4 --> G2

A3 --> H1
B2 --> H2
B3 --> H2
B4 --> H2
B5 --> H2
H2 --> H3
D1 --> H3
J2 --> H3

A1 --> I2
A3 --> I3
E1 --> I3
E2 --> I3
E3 --> I3

A3 --> K1
A3 --> K2
K1 --> K3
K2 --> K3
K3 --> K4
%% Theming & unified components track
K2 --> K5
K5 --> K6
K6 --> K7
K3 --> K7
K7 --> K8
%% Optional enhancements
K2 --> K9
K7 --> K10
K6 --> K11

## Critical path
- A1 → A3 → H1 → F2 (routing → brand SSR + runtime industry → LLM classifier active → mapping admin view).
- B1 → C1 → B2/B5 → D1 → E1/E2/E3 → D2 (telemetry → consent → signals → rules engine → micro components → first rules live).
- A3 → K1/K2 → K3 → K5 → K6 → K7 → K8 (brand SSR → MDX loader + theme → campaign renderer → Theme‑aware CoverPage → Unified Components → Frontmatter schema → TMOBILE refactor). Optional polish: K9/K10/K11.
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
 - See also: T14 implementation plan (`docs/aui/T14-rules-engine-plan.md`) and roadmap section "20a) LLM Policy Engine (shadow→active)" in `docs/aui/aui-roadmap.md` for hybrid decisioning details.
