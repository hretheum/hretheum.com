# AUI Project Plan (Atomic Tasks, DoD, Metrics, Validation, Guardrails, Quality Gates)

Last updated: 2025-09-24
Status: Draft (for review)

See also: [AUI Task DAG](./AUI_DAG.md).

This plan enumerates atomic tasks to deliver the Adaptive UI (AUI) roadmap. Each task includes: Definition of Done, measurable success metrics with validation methods, guardrails, and quality gates.

Conventions
- Environments: local → preview → production.
- Budgets: CWV thresholds LCP ≤ 2.5s p75, CLS ≤ 0.1 p75, INP ≤ 200ms p75.
- Consent: any behavioral tracking (beyond routing) is gated by explicit consent.
- Brand canonical: subdomains 301 → `https://hretheum.com/brand/<slug>`.

---

## Workstream A — Routing & Canonicalization

### ✅ T1. Implement default-allow subdomain routing with 301 to /brand/<slug>
- Status: ✅ Completed — Functional; error-rate ops integrated; pending: SEO crawl
- Rationale: Single canonical per brand; consistent entry for campaigns.
- Inputs/Deps: blacklist list, slug regex, `middleware.ts` infra.
- Steps: parse host, validate slug, enforce blacklist, build target URL, 301 redirect; preserve UTM.
- Definition of Done (DoD)
  - [x] ✅ Requests to `<brand>.hretheum.com` (not blacklisted) 301 to `https://hretheum.com/brand/<slug>`; preserves path `/` and query/UTM.
  - [x] ✅ Blacklisted subdomains bypass 301 and render neutral apex route.
  - [x] ✅ Slug normalization: lowercase; `[a-z0-9-]{1,63}`; collapse multiple dashes.
  - [x] ✅ Unit tests and e2e tests cover sample cases (zendesk, bayer, invalid idn/punycode, blacklist).
- Metrics
  - [x] ✅ Redirect correctness ≥ 99.9% (no loops, correct target) — computed in admin API with pass/fail.
  - [x] ✅ Middleware added latency p95 ≤ 5ms — computed in admin API with pass/fail.
  - [x] ✅ Error rate (<500s) ≤ 0.1% of subdomain requests — integrated via Vercel Custom HTTP Drain → `vercel_drain_events`; PASS/FAIL surfaced in Admin.
- Validation
  - [x] ✅ Automated e2e via Playwright.
  - [x] ✅ curl test matrix; server logs spot-check.
  - [ ] SEO check (no duplicate indexable subdomains).
- Guardrails
  - [x] ✅ No user data written pre-consent; preserve query params; no infinite redirects.
  - [x] ✅ Reserved subdomains and explicit hosts (via `NOINDEX_HOSTS`) emit `X-Robots-Tag: noindex, nofollow`; 301s to brand preserve UTM and force HTTPS on apex.
- Quality Gates
  - [x] ✅ Type-check clean; lint/format clean; manual QA on preview.
  - [x] ✅ Unit + e2e tests passing locally.
  - [x] Code review.

### ✅ T2. Reserved subdomain blacklist enforcement
- Status: ✅ Completed — middleware respektuje listę rezerwowanych subdomen (`www`, `app`, `admin`, `api`, `auth`, `static`, `cdn`, `assets`, `img`, `mail`, `ftp`, `m`, `stage`, `dev`) oraz blokuje przejście do przepływu brand.
- DoD:
  - ✅ Lista rezerw została skonfigurowana i loadowana z configu/infrastruktury A1.
  - ✅ Testy jednostkowe + syntetyczne żądania curl sprawdzają deny/allow i edge cases (uppercase, punycode, trailing dot).
  - ✅ Soft-fail: żądania kierowane na apex neutralny, logowane bez 500.
- Metrics: 0% leakage of blacklisted subdomains (monitorowane w admin API na podstawie redirect outcomes).
- Validation: unit tests + synthetic matrix.
- Guardrails: logowanie odmów, brak danych użytkownika zapisanych przed consentem.
- Quality Gates: review + lint/tests pass.

### ✅ T3. Canonical brand route `/brand/[slug]` (SSR) with runtime industry resolution
- Status: ✅ Completed — `app/brand/[slug]/page.tsx` renders `IndustryHero` w/ runtime industry (`resolveIndustrySSR`), self‑canonical metadata, and feature‑flagged debug caption; campaign accent overrides passed to hero.
- DoD: SSR brand route renders hero with runtime industry resolution (deterministic JSON → DB mapping → LLM classifier) and no flicker; self‑canonical. Deterministic mappings persisted to DB for admin visibility; optional debug caption is feature‑flagged on production.
- Metrics: LCP ≤ 2.5s p75 on `/brand/<slug>` (lab); zero CLS above‑the‑fold.
- Validation: Lighthouse/PSI lab runs; visual QA.
- Guardrails: no trademark assets; disclaimer block available.
- Quality Gates: design sign‑off; accessibility AA for hero.

### ✅ T4. SEO canonical & sitemap alignment
- Status: ✅ Completed — `/brand/[slug]` emituje `rel="canonical"` do apexu, subdomeny 301 kierują wyłącznie na brand canonical, a mapy witryny obejmują tylko trasy apexu.
- DoD:
  - ✅ `/brand/<slug>` ustawia self-canonical (`app/brand/[slug]/page.tsx` → `alternates.canonical`).
  - ✅ `middleware.ts` utrzymuje 301 dla subdomen → `https://hretheum.com/brand/<slug>` bez wyjątków (zależność T1/T2).
  - ✅ `sitemap.xml` oraz indeks site mapów wykluczają subdomeny; jedynym źródłem jest apex (task ops aktualny diff).
- Metrics: 0 zduplikowanych canonicali w audycie SEO; crawl budget bez zmian (monitoring Screaming Frog + Search Console Coverage).
- Validation: Screaming Frog crawl 100 URL; Search Console inspect (`brand/<slug>`); porównanie logów redirectów.
- Guardrails: robots.txt bez zmian dla apexu; `X-Robots-Tag` na reserved hosts pozostaje `noindex`.
- Quality Gates: SEO review + QA pass.


### ✅ T5. Legal disclaimers for brand references
- Status: ✅ Completed — brandowe kampanie korzystają tylko z tekstowych wzmianek, komponent disclaimera jest włączany warunkowo, brak logotypów bez zgody.
- DoD:
  - ✅ Materiały referują marki wyłącznie tekstowo; frontmatter i komponenty MDX nie renderują logo.
  - ✅ Komponent disclaimer (`CampaignDisclaimer`) gotowy do użycia per kampania/brand.
  - ✅ Globalny toggle pozwala ukryć wzmianki o marce (fallback neutralny).
- Metrics: 0 naruszeń w lintingu treści (scripts/content-lint) + manual QA.
- Validation: lista kontrolna review legal/content.
- Guardrails: toggle `showBrandMentions` + brak PII.
- Quality Gates: legal i content sign-off.

---

## Workstream B — Telemetry & Signals

See also: [Consent vs Signal Matrix](./consent-signal-matrix.md).

### ✅ T6. Define telemetry schema and event catalog
- Status: ✅ Completed — katalog zdarzeń i wspólne pola opisane w `docs/aui/consent-signal-matrix.md` oraz `docs/aui/REDIRECT_TELEMETRY_CONSENT.md`; schemat telemetryjny egzekwowany w kodzie (`lib/telemetry/schema.ts`).
- DoD:
  - ✅ Zdefiniowano zestaw pól (`ts`, `session_id`, `brand`, `campaign_source`, `campaign_type`, `device`, `viewport`, `locale`, `referrer`, `consent`) oraz kontrakt ID (`anon_user_id`).
  - ✅ Wymuszono katalog eventów (`nav.view`, `dwell.time`, `nav.scroll`, `ui.click`, `ui.hesitation`, `ui.rage_clicks`, `form.submit`, `rag.query`, `rag.response`).
  - ✅ Dokumentacja i matryca consent aktualne (`docs/aui/consent-signal-matrix.md`).
- Metrics: 100% eventów przechodzi walidację schematu (CI + testowe ingestie).
- Validation: JSON Schema lint w CI (`npm run lint:telemetry`) + próbne zasilenia do Supabase.
- Guardrails: brak PII domyślnie, hash treści wiadomości, zgodność z Consent vs Signal Matrix.
- Quality Gates: zaktualizowane docs, review inżynierskie.

### ✅ T7. Instrument page view & dwell time (consent‑gated)
- Status: ✅ Completed — `nav.view` i `dwell.time` emitowane w `app/components/CtaTelemetry.tsx` / `useTelemetry()` z bramkowaniem consent (`useConsent`).
- DoD:
  - ✅ `nav.view` odpala się przy zmianie trasy (Next.js router events) z konsystentnym `target_id`/`route`.
  - ✅ `dwell.time` wysyłane na zdarzenia `visibilitychange`/`beforeunload` z debouncingiem.
  - ✅ Consent gating aktywne (bez zgody brak emisji) — integracja z `ConsentBanner` (`T12`).
- Metrics: skuteczność dostarczenia zdarzeń ≥ 99% i błąd próbkowania ≤ 5% (monitoring Supabase + synthetic timers).
- Validation: testy syntetyczne (czasomierze) + porównanie liczników frontend/backoffice.
- Guardrails: brak blokowania unload; emisja zdarzeń debounce'owana.
- Quality Gates: QA na 3 przeglądarkach + brak regresji budżetu wydajności.

### ✅ T8. Scroll depth and velocity
- Status: ✅ Completed — `nav.scroll` emituje bucketowane głębokości (0.25/0.5/0.75/0.9) i prędkość (<300 / 300–800 / >800 px/s) w `useTelemetry()`.
- DoD:
  - ✅ Scroll bucketowany na bazie `IntersectionObserver` / `window.scrollY`, zapisany w telemetry event.
  - ✅ Velocity liczone na podstawie różnicy scrollY w czasie i mapowane do trzech przedziałów.
  - ✅ Consent gating — brak emisji bez zgody (`useConsent`).
- Metrics: sanity check dystrybucji (brak >10% eventów bez kontekstu route) monitorowany w Supabase dashboardzie.
- Validation: testy syntetyczne (symulowane scrollowanie) oraz manual QA.
- Guardrails: throttling (requestAnimationFrame + `passive` listeners) utrzymuje budżet INP.
- Quality Gates: perf profiling pass (Chrome Performance) + code review.

### ✅ T9. CTA click tracking
- Status: ✅ Completed — primary CTAs emit `ui.click` (Home/Brand); stable ids; consent‑gated in analytics layer.
- DoD: `ui.click` with stable `target_id` for primary CTAs on Home/Brand pages.
- Metrics: >95% alignment with backend goal completions.
- Validation: sampled session replays (if enabled) vs events; manual.
- Guardrails: id stability contract; no PII in ids.
- Quality Gates: design/dev alignment on ids.
 - Notes: global mount `CtaTelemetry` in `app/layout.tsx`; fallback z `gtm.linkClick` → syntetyczny `ui.click`; debug env `NEXT_PUBLIC_TELEMETRY_DEBUG` (dev) i `NEXT_PUBLIC_ENABLE_GTM` guard.

### ✅ T10. Hesitation & rage/dead clicks
- Status: ✅ Completed — `ui.hesitation`, `ui.rage_clicks`, `ui.dead_click` zaimplementowane w `useTelemetry()` z próbkowaniem, consent gating i wysyłką do Supabase.
- DoD:
  - ✅ `ui.hesitation`: emitowane po >2s hover/focus na CTA/elementach interaktywnych.
  - ✅ `ui.rage_clicks`: wykrywa ≥3 szybkie kliknięcia w 1s; `ui.dead_click`: kliknięcia w elementy nieinteraktywne.
  - ✅ Consent gating i sampling — zdarzenia wysyłane wyłącznie przy zgodzie, z limitami częstotliwości.
- Metrics: brak regresji INP (listener CPU <1%) monitorowane w perf budżetach (LHCI + RUM).
- Validation: profilowanie (Chrome Performance) + syntetyczne scenariusze frustracji.
- Guardrails: respektowanie consentu, sampling, brak PII.
- Quality Gates: performance i privacy check, code review.

### ✅ T11. RAG telemetry augmentation
- Status: ✅ Completed — `app/components/RagChat.tsx` wysyła `brand_slug`, `campaign_source`, `campaign_type`; `app/api/rag/query/route.ts` zapisuje w `chat_events.meta` (insert + low‑conf update + SSE/non‑SSE final update).
- DoD: `app/api/rag/query/route.ts` logs `brand`, `campaign_source`, `campaign_type` with existing fields (`msg`, `intent`, `confidence`, `selectedCount`, `top1Boosted`, `lowConfidence`).
- Metrics: ≥99% of RAG events with brand when on brand route.
- Validation: unit test; log sampling.
- Guardrails: hash msg content; no PII.
- Quality Gates: backend review.

---

## Workstream C — Consent & Privacy

### ✅ T12. Consent gating for behavioral analytics
- Status: ✅ Completed — `ConsentBanner` (UI, PL copy) + global store (`useConsent`) + bramkowanie w `CtaTelemetry` i `RumVitals`; `RedirectBeacon` już z env/cookie guard.
- DoD: cookie banner/consent UI; when denied, only routing context allowed; all micro‑behavior tracking disabled.
- Metrics: 0 events emitted without consent (automated checks).
- Validation: e2e tests toggling consent; telemetry diffs.
- Guardrails: GDPR/CCPA compliant copy; DSAR path documented.
- Quality Gates: legal review; accessibility.

### T13. Privacy documentation & DSAR process
- DoD: docs updated; DSAR request playbook; retention windows set.
- Metrics: documentation completeness checklist 100%.
- Validation: internal audit.
- Guardrails: minimum data principle.
- Quality Gates: legal approval.

---

## Workstream D — Decision Layer (Hybrid Rules + AI)

### T14. Minimal rules engine
- DoD: deterministic evaluation order, condition → action mapping, scopes (SSR/CSR/RAG), idempotent actions, safe fallbacks.
- Metrics: rule evaluation p95 ≤ 2ms; 100% unit test coverage for rules parser/evaluator.
- Validation: unit tests; scenario tests.
- Guardrails: no stateful side effects without guards.
- Quality Gates: architecture review.
### T14. Minimal rules engine (Hybrid with LLM Policy)
- Status: In progress — see T14 implementation plan: [docs/aui/T14-rules-engine-plan.md](./T14-rules-engine-plan.md)
- DoD:
  - Deterministic engine: evaluation order, condition → action mapping, scopes (SSR/CSR/RAG), idempotent actions, safe fallbacks.
  - LLM Policy Engine (shadow→active): consumes PII-safe session summary; recommends one action from an allowlisted set; exposed via `POST /api/decision/policy` (strict JSON schema, timeouts, retries, cost caps).
  - Aggregation & precedence: hard rules (consent/legal/security; SSR above-the-fold) override AI; AI suggestions have per-session caps.
  - Feature flags: `NEXT_PUBLIC_RULES_AI_ENABLED`, `RULES_AI_SHADOW_ONLY`, `RULES_AI_TIMEOUT_MS`, `RULES_AI_SAMPLE_RATE`, `RULES_AI_ALLOWED_ACTIONS`.
- Metrics:
  - Deterministic eval p95 ≤ 2 ms (SSR/CSR); AI policy p95 ≤ 300–600 ms (CSR, off critical path).
  - 100% unit coverage for engine; ≥2 scenario tests per scope (SSR/CSR/RAG); shadow vs rules agreement tracked.
- Validation:
  - Unit tests + scenario tests; shadow-mode logging and comparison; cost/latency budgets verified on preview.
- Guardrails:
  - Consent gating; allowlist actions only; sampling & per-session rate limits; no raw PII in prompts; structured parsing with safe fallbacks.

### T15. Implement initial 3 rules
- DoD: (1) low-confidence RAG → suggested queries (3 items); (2) hesitation>2s on primary CTA → tooltip; (3) Novice → progressive disclosure on Home/Brand.
- Metrics: +5–10% TTFV improvement for low-confidence sessions; tooltip display rate < 15% of sessions; no CWV regression.
- Validation: A/B for (1), telemetry counters for (2)(3).
- Guardrails: cap exposures per session; easy kill-switch.
- Quality Gates: design sign-off for UI changes; accessibility.

---

## Workstream E — Micro-adaptations (CSR)

### T16. Tooltip component (brand-aware micro-copy)
- DoD: reusable CSR component with accessibility (focus, ESC close); supports brand/industry copy.
- Metrics: no INP regressions; interaction latency p95 < 100ms.
- Validation: keyboard navigation tests; screen-reader pass.
- Guardrails: frequency caps.
- Quality Gates: a11y AA pass; unit tests.

### T17. Suggested queries component for RAG
- DoD: chip/list UI renders 3–5 suggestions based on brand/industry; click inserts query.
- Metrics: +10% reduction in reformulations for low-confidence sessions.
- Validation: compare cohorts; event tracking.
- Guardrails: suggestions curated or safe generated; profanity filter.
- Quality Gates: UX review; unit/integration tests.

### T18. Progressive disclosure toggler
- DoD: hide/expand advanced blocks based on `proficiency` segment; SSR default safe.
- Metrics: decreased bounce for Novice; no negative impact on Power users.
- Validation: cohort analysis; AB test optional.
- Guardrails: always provide path to full content.
- Quality Gates: UX/accessibility sign-off.

---

## Workstream F — Admin & Governance

### T19. Admin read-only brand cohorts dashboard
- DoD: tables/graphs for brand cohorts (hero CTR, dwell, conversion, rage/dead clicks, RAG reformulations).
- Metrics: data freshness ≤ 1h; uptime ≥ 99%.
- Validation: spot-check counts vs raw events.
- Guardrails: access via Supabase Auth; allowlist `eof@offline.pl`.
- Quality Gates: security review.

### T20. Brand→industry mapping management (read-only v1)
- DoD: view mapping; status flags: `auto-generated`, `needs-review`, `locked`.
- Metrics: mapping coverage ≥ 80% for active brands.
- Validation: manual review workflow.
- Guardrails: no edits in v1 (read-only); edits planned v2.
- Quality Gates: admin UX review.

### T21. Content lock & disclaimer toggles
- DoD: flags to disable auto-generated copy for selected brands; toggle disclaimers.
- Metrics: 100% consistency between flags and UI.
- Validation: e2e tests.
- Guardrails: audit log of changes.
- Quality Gates: security review.

---

## Workstream G — Experimentation

### T22. Server-side A/B flagging framework
- DoD: feature flags for SSR variants (hero/CTA); exposure logging; randomization per session.
- Metrics: no assignment bias (χ² test p>0.05); flag eval p95 ≤ 2ms.
- Validation: statistical sanity checks; unit/integration tests.
- Guardrails: global kill-switch; holdouts.
- Quality Gates: data science review.

### T23. First A/B: hero/CTA per brand
- DoD: two variants per brand (copy/layout within templates); exposure tracking; 2-week run or N events.
- Metrics: +5% hero CTR; neutral CWV.
- Validation: t-test or Bayesian; power ≥ 0.8.
- Guardrails: pre-registered hypothesis; avoid overlap with other tests on same surface.
- Quality Gates: experiment review board.

---

## Workstream H — AI/LLM (Shadow → Active)

### ✅ T24. LLM brand→industry classifier (active)
- Status: ✅ Completed — runtime classifier with model fallback, hardened parsing, debug endpoint `/api/admin/industry/debug`, suggestions persisted, optional autopromote by confidence.
- DoD: constrained prompt selecting from allowed set `{SaaS, Pharma, FinTech, Commerce, Manufacturing, Public, eLearning, Telecom, Generic}` with timeouts and logging; SSR per‑request; deterministic/DB mappings take precedence.
- Metrics: agreement with manual mapping ≥ 85% on sample of 100 brands.
- Validation: labeled sample + live debug checks.
- Guardrails: cost caps; timeouts; no PII in prompts; suggestions always saved for review.
- Quality Gates: architecture and ops review.

### T25. LLM session interpreter (shadow)
- DoD: session JSON → `{ intent_summary, recommended_action, confidence }` from allowed actions; logs only.
- Metrics: correlation with human rating ≥ 0.6.
- Validation: sample review; inter-rater reliability.
- Guardrails: constrained actions; rate limits.
- Quality Gates: architecture review.

### T26. Promote safe actions to active
- DoD: enable limited actions under thresholds (e.g., show_suggestions); monitor impacts; easy rollback.
- Metrics: no negative CWV/SEO; +3–5% TTFV in target cohorts.
- Validation: staged rollout; guardrail metrics dashboard.
- Guardrails: rollout ≤ 20% traffic for first week; auto-disable on regression.
- Quality Gates: change advisory sign-off.

---

## Workstream I — Performance, Security, Accessibility

### T27. Performance budgets & monitoring
- Status: In Progress — LHCI budżety dodane (mobile/desktop) z progami: Perf ≥ 0.90; LCP ≤ 2500 ms; CLS ≤ 0.10; TBT ≤ 250 ms; Interactive ≤ 4000 ms. RUM (web‑vitals) uruchomiony z consent gatingiem (localStorage/cookie) i samplingiem (`NEXT_PUBLIC_RUM_SAMPLE_PCT`), z wysyłką do GTM (`web_vitals`) i opcjonalnego API (`/api/metrics/rum`). Pending: dashboard RUM + alerty (p75 LCP/CLS/INP brand/home).
- DoD: budgets enforced in CI (Lighthouse CI); runtime RUM dashboard for CWV.
- Metrics: LCP/CLS/INP p75 within budgets for Home/Brand.
- Validation: CI gates (GitHub Actions: `.github/workflows/lhci.yml`, komendy: `npm run lhci:mobile|desktop`); production RUM sampling (env `NEXT_PUBLIC_RUM_*`).
- Guardrails: block deploy on regression.
- Quality Gates: SRE/Perf review.

### T28. Subdomain regex validation & rate limiting for unknown brands
- DoD: strict regex; reject idn/punycode; rate-limit spikes; alerting.
- Metrics: 0 security incidents; 0 5xx spikes from abuse.
- Validation: chaos/attack simulations.
- Guardrails: safe defaults; fallbacks to neutral route.
- Quality Gates: security review.

### T29. Accessibility checks (AA)
- DoD: hero/CTA, tooltip, suggestions meet WCAG 2.1 AA; keyboard and SR tested.
- Metrics: axe violations = 0 critical/serious.
- Validation: automated axe + manual.
- Guardrails: contrast minimums; focus visible.
- Quality Gates: a11y sign-off.

---

## Workstream J — Documentation & Rollback

### T30. Developer documentation & runbooks
- DoD: docs for telemetry schema, rules, components, admin flows; runbooks for debugging and consent.
- Metrics: onboarding time ≤ 2h for new dev to instrument a new page.
- Validation: doc dry-run by a teammate.
- Guardrails: versioned docs; links in repo README.
- Quality Gates: docs review.

### T31. Rollback & kill-switch playbook
- DoD: documented steps to disable rules/LLM/actions via flags; emergency 301/canonical rollback.
- Metrics: rollback time ≤ 10 minutes.
- Validation: game day exercise.
- Guardrails: clear ownership; on-call rota.
- Quality Gates: incident review sign-off.

---

## Timeline (indicative)
- Phase 1 (Weeks 1–2): T1–T7, T11, T3–T5.
- Phase 2 (Weeks 3–4): T8–T10, T14–T18, T19.
- Phase 3 (Weeks 5–6): T20–T23, T24–T26.
- Phase 4 (Week 7+): T27–T31 continuous.

---

## Workstream K — Campaigns & Theming (MDX)

### ✅ T32. MDX campaign support and loader
- Status: ✅ Completed — index + frontmatter loader + MDX compile (RSC) + component map + CampaignRenderer; accent injected on brand page.
- DoD: `next-mdx-remote` (or equivalent) loader with frontmatter parsing, component map, and SSR compilation.
- Guardrails: no unapproved logos; consent‑gated telemetry; per‑brand activation via `data/campaigns/index.json`.

### ✅ T33. Industry theme tokens and brand overrides
- Status: ✅ Completed — tokeny (`accent`, `headlineCase`, `slashAngle/Offset`, `gradient*`, `captionStyle`, `ctaVariant`) zaimplementowane w `lib/theme/industryTheme.ts`; użyte w `IndustryHero` i w rendererze kampanii (`CampaignThemeProvider` + theming dla komponentów MDX: CTA, Metrics, Timeline, CaseStudy, Playbook, Gallery). Frontmatter `accent` nadpisuje akcent.
- DoD: `getIndustryTheme(industry)` returns tokens (accent, gradient, headlineCase, slashAngle/Offset, captionStyle, ctaVariant); campaign frontmatter can override `accent` etc.

### ✅ T34. Campaign renderer and routing integration
- Status: ✅ Completed — `/brand/[slug]` sprawdza aktywną kampanię i renderuje `CampaignRenderer`; fallback do generycznego `Content` gdy brak kampanii; theme accent merge przez `IndustryHero`.
- DoD: `/brand/[slug]` checks active campaign; renders CampaignRenderer with theme merge; fallback to generic industry content uses same components.

### ✅ T35. T‑Mobile campaign MDX
- Status: ✅ Completed — finalny frontmatter (w tym `hero_headline`), poprawiony nagłówek, przegląd copy i wizualne QA; przygotowano Hiring Manager Brief w `docs/sauce/tmbbile.md`.

### ✅ T36. Theme‑aware CoverPage (Etap 1) — Provider + tokens na Home
- Status: ✅ Completed — Theme Provider podłączony do `app/components/CoverPage.tsx`; neon slash i CTA korzystają z tokenów (`accent`, `gradient*`, `ctaVariant`). QA + Lighthouse lab wykonane (raporty w `reports/lighthouse/`).
- DoD: `CoverPage` używa tokenów (`accent`, `gradient*`) zamiast twardych kolorów; brak regresji CWV; layout bez flicker (SSR above‑the‑fold).
- Metrics: neutralne CWV vs baseline; wizualna spójność z kampaniami. Lighthouse (lab, simulate): Home(mobile) Perf≈0.96 LCP≈1.84s CLS≈0.10; Home(desktop) Perf≈0.78 LCP≈5.44s; Brand/tmobile: Perf≈0.92 LCP≈1.86–1.99s CLS≈0.16 (po optymalizacji hero).
- Validation: Lighthouse lab (mobile+desktop) + wizualne QA na 3 breakpointach. Notatki: dalsza redukcja CLS brand do ≤0.10 możliwa przez preload czcionek/system font stack i dalszą stabilizację wysokości hero.
- Guardrails: brak logotypów; kontrast AA.

### ✅ T37. Theme‑aware CoverPage (Etap 2) — Unifikacja komponentów
- Status: ✅ Completed — unified shared components w `app/components/ui` i zastosowane na Home/Kampaniach: `SectionTitle`, `OutcomeBanner`, `CTAGroup/CTABanner`, `CaseGrid` (Home `CaseStudiesPage` refactor). Brak duplikatów między root/kampania dla tych powierzchni; komponenty konsumują tokeny przez `CampaignThemeProvider`/CSS var `--campaign-accent`.
- DoD: jeden komponent na wzorzec, konsumpcja tokenów przez `ThemeProvider`; brak duplikatów root/kampania.
- Metrics: redukcja duplikacji (LOC/komponenty); szybsze iteracje UI.
- Validation: Type-check + e2e smoke.
- Guardrails: nie łamać SSR/CSR rozdziału.

### ✅ T38. Frontmatter schema (Etap 3) — parametryzacja layoutu i tokenów
- Status: ✅ Completed — schema Zod w `lib/campaigns.ts` (`ZCampaignFrontmatter`) + walidacja w `compileCampaignForBrand`; dodano dokumentację w `docs/aui/campaign-frontmatter.md` i skrypt CI `scripts/validate_campaigns.ts` (npm script: `validate:campaigns`). CTA `href` fallback z env.
- DoD: walidacja w compile‑time dla MDX; czytelna dokumentacja z przykładami.
- Metrics: 100% kampanii przechodzi walidację; brak runtime errors.
- Validation: kompilacja MDX z błędnym frontmatter powinna zfailować z jasnym komunikatem.
- Guardrails: ograniczyć logikę w frontmatter — tylko parametry/layout.

### ✅ T39. Refactor TMOBILE MDX (Etap 4) — nowy layout
- Status: ✅ Completed — nowy layout w `tmobile_g2m_lead.mdx`: intro `SectionTitle` + `MetricsStrip` + `CaseGrid` + `OutcomeBanner`; meta blok (`CampaignMeta`) i `CTABanner` dla mobile. Sekcje `CaseStudyRich`/`Playbook`/`Timeline` uproszczone i zgrane stylistycznie; CTA zgodne z frontmatter i telemetrią.
- DoD:
  - ✅ Eliminated layout overflow („lanie się tekstu”) — siatkowe komponenty (`CaseGrid`, `MetricsStrip`) oraz `break-words` w `app/campaign/components.tsx` pilnują łamania.
  - ✅ Spójny, brandowany layout — komponenty MDX konsumują tokeny (`CampaignThemeProvider`), blok `KEYWORDS` używa minimalistycznych pill-chipów (`rgba(226,0,116,0.12)`), CTA wycentrowane (`align="center"`).
  - ✅ Zachowane i odświeżone polskie copy — sekcje portfolio/model operacyjny zaktualizowane bez regresji mobile/desktop.
- Metrics: subiektywna ocena wizualna + telemetria CTR na CTA.
- Validation: wizualne QA; klikowalność CTA; brak regresji na mobile.
- Guardrails: zgodność z polityką AUI (canonical, telemetry, no logos).


### T40. (Opcjonalne) NeonSlash jako tło sekcji
- DoD: lekki komponent tła z tokenami gradientu; toggle per sekcja/brand; brak regresji wydajności.

### T41. (Opcjonalne) Override wariantu CTA z frontmatter
- DoD: możliwość nadpisania `ctaVariant` per sekcja; stabilne `target_id` w telemetrii.

### T42. (Opcjonalne) Tuning `.prose` spacing na stronach kampanii
- DoD: doprecyzować marginesy/rozmiary nagłówków per brand; bez zmiany semantyki.

## Owners (initial)
- Routing/SEO: Eng + SEO partner.
- Telemetry/Consent: Eng + Legal.
- Decision/Micro‑adaptations: Eng + Design.
- Admin/AI: Eng + Data.

## Recommended Next Steps (per DAG)
- **Decision layer:** Z sygnałami telemetrycznymi (T6–T10) gotowymi, rozpocząć `T14` (minimal rules engine), co odblokuje `T16–T18` oraz `T15`.
- **Performance & RUM:** Dokończyć `T27` (dashboard + alerty) przed rozszerzeniem mikro-adaptacji/eksperymentów.
- **Admin tooling:** Przy aktywnym `T24` zaplanować `T20` (brand→industry mapping view) po zasileniu cohortami z `B2–B5`.
- **Experimentation readiness:** Po `T14` i telemetrycznych sygnałach przygotować `T22` (SSR A/B flagging) jako krok do `T23`.
