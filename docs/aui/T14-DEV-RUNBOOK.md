# T14 Dev Runbook — Suspend/Resume

Status: Ready for use
Last updated: 2025-09-26

This runbook documents the exact steps to pause work on T14 (Rules Engine + CSR tooltip) and resume later without relying on conversation history. It also captures the current implementation status, environment flags, verification steps, and known issues.

## Current Status Snapshot
- Client mounts centralized in `app/components/ClientGlobals.tsx` (client component), loaded from `app/layout.tsx`.
- Campaign rendering (brand pages) is SSR via `compileCampaignForBrand` in `lib/campaigns.ts`.
  - In development, `lib/campaigns.ts` forces `jsxDEV` so React Dev properties are present and the dev/prod mismatch warning is avoided.
  - As a fallback, you can fully disable campaign MDX rendering in dev via an env flag (see below).
- CSR rules adapter available via `app/components/useAdaptiveRules.ts`.
- Global tooltip effect renderer implemented: `app/components/MainCtaTooltipClient.tsx`.
  - Robust main CTA detection (brand hero → primary CTAs → closing banner) and retry for ~5s if anchor is not yet in DOM.
- AI Policy demo effects (optional): `app/components/AiPolicyDemoEffects.tsx`.
- Brand page: `app/brand/[slug]/page.tsx` supports a dev-only flag to fall back to generic content instead of MDX campaign.

## Env Flags (copy/paste)
Add these to `.env.local` as needed.

```bash
# Core rules toggle (CSR engine enabled)
NEXT_PUBLIC_RULES_ENABLED=true

# Enable hesitation tooltip (CSR deterministic rule)
NEXT_PUBLIC_RULES_CSR_HESITATION_TOOLTIP=true

# Temporary: disable campaign MDX rendering in development (only)
# When true (and NODE_ENV !== 'production'), brand page renders generic fallback Content.
NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV=true

# AI policy (optional; demo)
NEXT_PUBLIC_RULES_AI_ENABLED=true
RULES_AI_ENABLED=true
RULES_AI_SHADOW_ONLY=false
RULES_AI_TIMEOUT_MS=1500
RULES_AI_SAMPLE_RATE=1
RULES_AI_ALLOWED_ACTIONS=ui.tooltip

# Rules telemetry (engine-level, optional)
RULES_TELEMETRY_ENABLED=true
RULES_TELEMETRY_SAMPLE_RATE=1

# CSR Suggested Queries (T15)
NEXT_PUBLIC_RULES_CSR_SUGGESTED_QUERIES=true
NEXT_PUBLIC_RULES_AI_DEMO=true
```

Notes:
- Do not commit secrets. Values above are safe feature flags.
- In production, leave `NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV` unset (or `false`). Campaigns remain SSR.

## How to Run (Dev)
1) Start dev server:
```bash
npm run dev
```
2) Open: `http://localhost:3000/brand/tmobile`
3) Verify tooltip appears near the main CTA once per session (auto-hides after ~8s). If not visible immediately, scroll slightly.
4) If campaign MDX causes instability in dev, set `NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV=true`, restart dev, and re-test.

## E2E Tests
- Run Playwright E2E (redirect middleware tests already pass):
```bash
REDIRECT_E2E_BASE=http://localhost:3000 npm run test:e2e -- --reporter=line
```
- Next to add (recommended):
  - Consent on/off flow for analytics (T12).
  - Tooltip presence on brand page when flags are enabled (T14/T15).

## Suspend — What to Commit Before Switching Context
- Ensure the following files are present and unchanged locally:
  - `app/components/ClientGlobals.tsx`
  - `app/layout.tsx` (uses `<ClientGlobals />`)
  - `app/brand/[slug]/_components/CampaignRenderer.tsx` (SSR path only)
  - `lib/campaigns.ts` (dev: `jsxDEV`; prod: standard SSR)
  - `app/brand/[slug]/page.tsx` (supports `NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV`)
  - `app/components/MainCtaTooltipClient.tsx` (tooltip renderer with retries)
- Optional: set `NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV=true` in `.env.local` to keep brand route stable in dev while other tasks go to prod.
- Suggested commit message:
```
chore(docs/runbook): add T14 dev runbook; stabilize brand dev via optional disable flag; client globals mount
```

## Resume — Checklist
1) Ensure dev stability flags are correct for your scenario:
   - For MDX campaign testing in dev, set `NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV=false` and restart.
2) Verify tooltip behavior on `/brand/<slug>` (e.g., `/brand/tmobile`).
3) Add/extend E2E tests for:
   - Consent gating (banner visible; cookie set; events post only with consent when required).
   - Tooltip visibility on main CTA when flags are on.
4) Remove any temporary flags before preparing a production PR (unless they are intended as permanent feature toggles).

## Troubleshooting
- Invalid hook call (React 19):
  - Ensure client-only components are not imported with `next/dynamic({ ssr:false })` from Server Components. Use a client aggregator: `app/components/ClientGlobals.tsx` and render it in `app/layout.tsx`.
  - Confirm there is a single React copy in deps (React 19 + next@15.5.x in lockstep).
- React dev/prod mismatch (MDX):
  - `lib/campaigns.ts` compiles MDX with `jsxDEV` in dev to keep React development properties. This avoids the "Attempted to render … without development properties" error.
  - If issues persist, temporarily set `NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV=true` and restart dev.
- Tooltip not visible:
  - Check flags: `NEXT_PUBLIC_RULES_ENABLED=true`, `NEXT_PUBLIC_RULES_CSR_HESITATION_TOOLTIP=true`.
  - Ensure main CTA exists. In DevTools Console:
    ```js
    !!document.querySelector('a[data-cta-id="brand_hero_cta"]')
    ```
  - Scroll slightly to trigger viewport passes; tooltip auto-hides after ~8s.

## File Map (Key)
- `app/components/ClientGlobals.tsx` — client-side aggregator for global mounts (AI policy, demo effects, tooltip, chaos).
- `app/layout.tsx` — server layout that renders `<ClientGlobals />` (no `next/dynamic({ ssr:false })`).
- `app/brand/[slug]/_components/CampaignRenderer.tsx` — SSR rendering of campaigns.
- `lib/campaigns.ts` — campaign loader/MDX compiler; uses `jsxDEV` in development.
- `app/brand/[slug]/page.tsx` — brand page; accepts `NEXT_PUBLIC_DISABLE_CAMPAIGN_DEV` in development.
- `app/components/MainCtaTooltipClient.tsx` — tooltip renderer (CSR rules effect) with delayed anchor detection.

## References
- AUI Project Plan: `docs/aui/aui-project-plan.md`
- Campaigns MDX Guide: `docs/aui/CAMPAIGNS_MDX.md`
- Rules Engine Plan: `docs/aui/T14-rules-engine-plan.md`
