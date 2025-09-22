# Campaigns in MDX: Architecture, Theming, and Rendering

Status: Draft (for review)
Last updated: 2025-09-22

See also: [AUI Task DAG](./AUI_DAG.md).

This document describes how brand subdomains can render employer‑specific campaigns using MDX while reusing the same UI components and the AUI engine across all industries. It also covers how brand accents (e.g., T‑Mobile magenta) can override industry theme tokens safely.

## Modes of operation
- Campaign‑first (MDX): when a brand has an active campaign file, the brand route renders the campaign content using reusable components.
- Industry‑first (generic): when no campaign is defined, the brand route renders generic, industry‑adaptive content using the same components and the industry theme tokens.

Both modes share:
- SSR above‑the‑fold (hero, CTA) to avoid flicker.
- Industry resolution via `resolveIndustrySSR(slug)` with sources: deterministic mapping, DB mapping, or LLM (+ suggestions, optional autopromote).
- AUI guardrails: canonicalization of subdomains to `/brand/<slug>`, consent gating for telemetry, no unapproved logos.

## Files and structure
- `data/campaigns/index.json`
  - Tracks active campaigns by brand slug, e.g. `{ "tmobile": { "slug": "tmobile_g2m_lead" } }`.
- `data/campaigns/<campaign>.mdx`
  - Frontmatter with campaign metadata and optional visual overrides.
- `lib/campaigns.ts`
  - Loader: reads frontmatter and compiles MDX; merges campaign overrides into the industry theme.
- `app/brand/[slug]/page.tsx`
  - Checks for active campaign. If found → render CampaignRenderer; else → fallback to generic brand page using the same components.

## MDX frontmatter (example)
```mdx
---
slug: tmobile_g2m_lead
brand: tmobile
industry: Telecom
accent: "#e20074"   # overrides industry accent (optional)
role: Go2Market, UX & UI Lead — One Portal Tribe
location: Warsaw, Mokotów (Hybrid)
contract: B2B, full-time
period: "2025-09-09 – 2025-10-09"
ctas:
  - label: "Schedule the Interview"
    href: "https://calendly.com/eorlowski-theeventa/short-intro"
    variant: primary
  - label: "Talk to my AI"
    href: "https://hretheum.com"
    variant: secondary
sections:
  - type: meta
  - type: metrics
  - type: case_studies
  - type: playbook
  - type: timeline
  - type: closing_cta
---

import { MetricsStrip, CaseStudy, Playbook, Timeline } from '@/app/campaign/components'

<MetricsStrip items={[
  { label: 'NPS', value: '+38' },
  { label: 'Conversion lift', value: '+16%' },
  { label: 'Time‑to‑ship', value: '−35%' },
]} />

<CaseStudy title="5G onboarding flows" bullets={[
  'Reduced time‑to‑first‑value by 22%',
  'Consistency across 3 markets',
]} />

<Playbook title="One Portal GTM" diagram="one-portal.svg" bullets={[
  'Unified design tokens',
  'Cross‑market governance',
  'Research → Pilot → Scale',
]} />

<Timeline steps={[
  'Discovery & alignment',
  'Waves of experimentation',
  'Scale & governance',
]} />
```

## Industry theme tokens with brand overrides
- Source of truth per industry: `data/brand_industries.json` (allowed: `SaaS`, `Pharma`, `FinTech`, `Commerce`, `Manufacturing`, `Public`, `eLearning`, `Telecom`, `Generic`).
- Theme tokens (example):
  - `accent`, `gradientFrom/To/Via`, `headlineCase` (uppercase/sentence), `slashAngle`, `slashOffsetY`, `captionStyle`, `ctaVariantPrimary`.
- Campaign overrides (from MDX frontmatter):
  - `accent` (e.g., T‑Mobile magenta) can replace the industry default for the current brand.
- Components should read the theme from context (industry theme merged with campaign overrides) to render consistently in both modes.

## Reusable components
- `CampaignHero`/`IndustryHero`: full‑bleed hero with FitText headline and neon slash; accepts `accent`, `ctas` and `debugBadge` (feature‑flagged on production via `NEXT_PUBLIC_INDUSTRY_DEBUG_BADGE`).
- `CampaignMeta`: displays `role`, `location`, `contract`, `period`.
- `MetricsStrip`: horizontal KPI badges.
- `CaseStudy`: title + bullet list + optional media.
- `Playbook`: diagram + key bullets.
- `Timeline`: sequenced steps.
- `CTAGroup`: standardized CTAs; emits telemetry events (`brand`, `campaign`, `industry`).

## SSR, telemetry and consent
- SSR: `app/brand/[slug]/page.tsx` uses `runtime='nodejs'`, `dynamic='force-dynamic'`, `revalidate=0`.
- Telemetry: CTA clicks and page events should include `brand`, `campaign`, `industry`. Consent gating required for behavioral analytics; RedirectBeacon respects `NEXT_PUBLIC_REDIRECT_BEACON_REQUIRES_CONSENT`.

## Governance & safety
- Legal safeguards: textual brand references; no unapproved logos.
- Admin visibility: DB tables `brand_industries`, `brand_industry_suggestions`, `industry_resolution_events` support auditing and review.
- LLM guardrails: constrained classes; timeouts; fallback to deterministic/DB or `Generic`.
