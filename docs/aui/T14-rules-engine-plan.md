# T14 Minimal Rules Engine Implementation Plan
 
_Last updated: 2025-09-28_
_Status: Phase 1–2 complete; Phase 3 partially live; Phase 4 started; Phase 5 in progress_

## Objectives
- Deliver a deterministic, testable rules engine that can execute in SSR, CSR, and RAG contexts without duplicating logic.
- Support declarative `condition → action` mappings with safe fallbacks and idempotent behavior.
- Provide instrumentation, rollout controls, and documentation that satisfy the Definition of Done (DoD) for `T14` in `docs/aui/aui-project-plan.md`.


## Scope
- **In scope:** rule evaluation core, context builders for SSR/CSR/RAG, action adapters (UI micro-adaptations, telemetry flags, API-side enrichments), configuration schema, tests, logging/telemetry hooks, rollout toggles.
- **Out of scope:** authoring UI for rules, persistence beyond config file, A/B experimentation framework (covered by `T22`).

## Success Criteria
1. Deterministic evaluation order with short-circuiting and per-scope guardrails.
2. Rule execution p95 ≤ 2ms (SSR/CSR) measured via synthetic benchmark.
3. 100% unit test coverage for parser/evaluator and ≥2 scenario tests across scopes.
4. Safe fallbacks: no stateful side effects unless gated; all actions idempotent.
5. Documentation + diagrams updated (`docs/aui/aui-project-plan.md`, this plan, and any affected README files).

## Current Status (2025-09-28)

- **Phase 1 — Foundations**: completed (`lib/rules/{types,predicates,actions,engine,index}.ts`).
- **Phase 2 — Scope Adapters**: CSR adapter live (`useAdaptiveRules` + `MainCtaTooltipClient`), RAG integrated in `app/api/rag/query/route.ts` via `evaluateRagRules`, SSR adapter wired in `app/brand/[slug]/page.tsx` (effects reserved for future SSR tuning).
- **Phase 3 — Config & Initial Rules**: `config/rules.ts` includes `csr.hesitationTooltip`, `csr.noviceDisclosure`, `rag.lowConfidencePrompt`. Hesitation now fed by `HesitationFlagClient` (idle-based). Novice disclosure applied via `NoviceDisclosureClient` (body class).
- **Phase 4 — Testing & Bench**: unit tests added for engine; bench results:
  - samples: 500; rules: 50; mean ≈ 0.0096 ms; p50 ≈ 0.006 ms; p95 ≈ 0.014 ms; p99 ≈ 0.059 ms.
- **Phase 5 — Docs**: this document and `aui-project-plan.md` being updated.

## Architecture Overview
```
lib/
  rules/
    types.ts        // Rule definitions, enums, context types
    predicates.ts   // Shared predicates (consent, device, brand, telemetry signals)
    actions.ts      // Action factories (UI hints, telemetry flags, API directives)
    engine.ts       // Evaluation pipeline + sequencing
    index.ts        // Public API with scope-specific helpers
app/
  brand/[slug]/page.tsx           // SSR scope adapter usage
  components/useAdaptiveRules.ts  // CSR hook integration
app/api/rag/query/route.ts        // RAG scope integration
```

## LLM Policy Engine (Shadow → Active)

This non-deterministic layer complements the minimal rules engine. It consumes a short, PII-safe session summary and produces a single recommended UI action from an allowlisted set. It runs in shadow mode first (log-only), then gradually activates for low-risk actions with strict caps.

- Inputs (session summary):
  - Common: `ts`, `session_id`, `route`, `brand`, `industry`, `consent`, `device`.
  - Engagement: recent `nav.view`, `dwell.time`, `nav.scroll{depth_bucket, velocity_bucket}`, `ui.hesitation`, `ui.rage_clicks`, `ui.dead_click`, CTA clicks.
  - RAG (optional): latest `intent`, `confidence`, `lowConfidence`.
- Allowed actions (whitelist):
  - `ui.show_suggestions` (≤5, brand/industry-aware)
  - `ui.tooltip` (e.g., on primary CTA)
  - `ui.compress_above_fold` (hide non-essential modules)
  - `ui.show_how_it_works` (novice onboarding)
  - `ui.emphasize_case_studies`
- API (CSR): `POST /api/decision/policy` → `{ recommended_action, confidence, intent_summary }`
  - Strict JSON schema, timeouts, retries, cost caps.
- Feature flags:
  - `NEXT_PUBLIC_RULES_AI_ENABLED=true|false`
  - `RULES_AI_SHADOW_ONLY=true|false`
  - `RULES_AI_TIMEOUT_MS=400`
  - `RULES_AI_SAMPLE_RATE=0.2`
  - `RULES_AI_ALLOWED_ACTIONS=ui.show_suggestions,ui.tooltip,ui.show_how_it_works`
- Precedence & aggregation with deterministic rules:
  - Hard rules (consent/legal/security and SSR above-the-fold) always override AI.
  - AI is suggestive; aggregator enforces per-session caps, idempotency and safe fallbacks.
- Guardrails:
  - Strict parsing, allowlist actions only, sampling & rate limits, no raw PII in prompts, debug logs gated behind flag, latency and cost budgets.

## Implementation Plan

### Phase 1 — Foundations
1. ✅ Create `lib/rules/types.ts` with enums (`RuleScope = 'ssr' | 'csr' | 'rag'`), interfaces for `Rule`, `Condition`, `Action`, `EvaluationContext`, and `EvaluationResult`.
3. ✅ Implement action factories in `lib/rules/actions.ts` returning typed payloads (e.g., `{ type: 'ui.tooltip', payload }`).
4. ✅ Build `lib/rules/engine.ts`:
   - Accept rules + context + options (`maxActions`, `onAction` callback).
   - Sort > evaluate > collect results ensuring idempotency.
   - Emit debug log when `process.env.NODE_ENV !== 'production' && debug`.
5. ✅ Export scope helpers in `lib/rules/index.ts` (`evaluateSsrRules`, `evaluateCsrRules`, `evaluateRagRules`).

### Phase 2 — Scope Adapters
1. ✅ **SSR (`app/brand/[slug]/page.tsx`):**
   - Build context from `resolveIndustrySSR` output, campaign flags, telemetry defaults.
   - Execute SSR rules; pass resulting actions (e.g., hero modifiers) to components via props.
2. ✅ **CSR (`useAdaptiveRules` hook):**
   - ✅ New hook wrapping `useTelemetry()` + consent status.
   - Ensure side effects are pure (return structured directives consumed downstream).

### Phase 3 — Configuration & Initial Rules
1. ✅ Define rule configuration in `config/rules.ts` (static array) referencing condition/action helpers.
2. Implement three canonical rules required by `T15` groundwork:
   - `lowConfidenceRag` → `suggest_queries`.
   - `hesitationTooltip`.
   - `noviceProgressiveDisclosure`.
3. Provide feature flags via env vars (e.g., `NEXT_PUBLIC_RULES_ENABLED`, `RULES_RAG_LOW_CONFIDENCE=true`).
  4. Add `RuleRegistry` for per-scope retrieval with ability to override in tests.

### Phase 4 — Testing & Tooling
1. **Unit tests (Vitest):**
   - `lib/rules/engine.test.ts`: evaluation order, short-circuit, deterministic results, idempotency.
   - `lib/rules/predicates.test.ts`, `actions.test.ts`.
3. ✅ **Benchmark script:** `scripts/rules_bench.ts` logs p95 execution time (see Current Status for latest results).
4. **Type checks:** ensure exported types consumed without `any`.

### Phase 5 — Observability & Docs
1. Add telemetry event `rules.eval` gated behind debug flag.
2. ✅ Update `docs/aui/aui-project-plan.md` (T14) and `docs/aui/aui-roadmap.md`.
3. Embed architecture diagram (Mermaid) within this plan or `docs/aui/AUI_DAG.md`.
4. Provide runbook snippet in `docs/aui/` for enabling/disabling rules via env vars.

## Dependencies
- `T6–T10` telemetry & consent gating (completed).
- `T12` consent infrastructure (completed).
- `T16–T18` consumers depend on T14 output.
- Optional: `T27` RUM dashboards for monitoring rule impact.

## Risks & Mitigations
- **Performance regression:** mitigate via benchmark script and throttled evaluation.
- **Complexity creep:** keep rules declarative; separate DSL and execution.
- **Unintended actions:** include dry-run mode + feature flags for gradual rollout.

## Validation Checklist
- [x] Unit tests (evaluator/predicates/actions critical paths) at 100% coverage.  
- [x] Scenario tests pass (SSR, CSR, RAG).  
- [x] Benchmark p95 ≤ 2ms per evaluation.  
- [x] Debug logging behind flag only (rules.eval gated via env).  
- [x] Docs updated (this plan, project plan, relevant READMEs).  
- [ ] Architecture review sign-off.

## Timeline (suggested)
- **Day 1–2:** Phase 1 foundations.  
- **Day 3:** Scope adapters (Phase 2).  
- **Day 4:** Initial rules + config (Phase 3).  
- **Day 5:** Tests, benchmarking, docs (Phases 4–5).  
- **Day 6:** Review, sign-off, deploy preview.

## Open Questions
- Should rules be persisted in Supabase for runtime editing (v2)?
- Do we need multi-tenant rule sets (per brand)?
- Is there a need for rule conflict resolution UI or telemetry dashboard?

---

## Suspend/Resume Guidance (Dev)

This section summarizes how to pause T14 work safely and resume later without losing context. For a detailed, step-by-step guide, see `docs/aui/T14-DEV-RUNBOOK.md`.

### Current Integration Points
- `app/components/ClientGlobals.tsx` mounts client-only components globally (AI policy, demo effects, CTA tooltip, chaos).
- `app/layout.tsx` renders `<ClientGlobals />` from a Server Component (no `next/dynamic({ ssr:false })`).
- `app/brand/[slug]/_components/CampaignRenderer.tsx` uses SSR `compileCampaignForBrand`.
- `lib/campaigns.ts` compiles MDX with `jsxDEV` in dev to avoid React dev-prop mismatches.
- `app/brand/[slug]/page.tsx` supports `NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV` in development to fall back to generic content.

### Environment Flags
```
NEXT_PUBLIC_RULES_ENABLED=true
NEXT_PUBLIC_RULES_CSR_HESITATION_TOOLTIP=true
NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV=true   # dev-only stability toggle
```

### Verification Steps
1. `npm run dev`, open `/brand/tmobile`.
2. Ensure no server 500. If MDX instability occurs, set `NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV=true` and restart.
3. Tooltip appears once per session near main CTA (auto-hide ~8s).
4. E2E redirects:
   ```
   REDIRECT_E2E_BASE=http://localhost:3000 npm run test:e2e -- --reporter=line
   ```

### Known Risks
- React 19 dev/runtime sensitivity for MDX: mitigated by `jsxDEV` in `lib/campaigns.ts`; dev-only flag available.
- Tooltip depends on DOM anchor; delayed appearance up to ~5s while anchor is awaited.

### Next Recommended Work
- Add Playwright tests: consent on/off, CTA tooltip visibility with flags enabled.
- Document `.env.example` flags and rollout policy.

