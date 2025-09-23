# Campaign Frontmatter Schema (AUI)

Status: Draft (kept in sync with `lib/campaigns.ts`)

This document describes the allowed frontmatter for campaign MDX files under `data/campaigns/`.
All fields are validated at build-time using Zod (`ZCampaignFrontmatter`).

## Fields

- `slug` (string, optional)
- `brand` (string, optional)
- `industry` (string, optional)
- `accent` (string, optional, CSS color)
- `ctaVariant` ("filled" | "outline", optional)
- `role` (string, optional)
- `location` (string, optional)
- `contract` (string, optional)
- `period` (string, optional)
- `ctas` (array, optional)
  - `label` (string, required)
  - `href` (string, optional; if missing, defaults to `NEXT_PUBLIC_CALENDLY_URL`)
  - `variant` ("primary" | "secondary", optional)
- `sections` (array, optional) — simple structural hints, e.g. `{ type: "metrics" }`
- `metrics` (array, optional)
  - `label` (string)
  - `value` (string)
  - `note` (string, optional)
- `case_grid` (object, optional)
  - `items` (array)
    - `title` (string)
    - `subtitle` (string, optional)
    - `challenge` (string, optional)
    - `solution` (string, optional)
    - `outcome` (string, optional)
    - `details` (string, optional)

## Example (valid)

```mdx
---
slug: tmobile_g2m_lead
brand: tmobile
industry: Telecom
accent: "#e20074"
ctaVariant: filled
ctas:
  - label: "Schedule a meeting"
    variant: primary
  - label: "Chat with my AI"
    href: "https://hretheum.com"
    variant: secondary
metrics:
  - label: "Markets"
    value: "10+"
  - label: "Squads"
    value: "15"
case_grid:
  items:
    - title: "Conversion paths"
      subtitle: "E‑shop"
      outcome: "+conversion"
    - title: "Design Ops"
      subtitle: "System & tokens"
      outcome: "faster delivery"
---

<SectionTitle title="GO‑TO‑MARKET ONE PORTAL" subtitle="Leadership • Outcomes • Operating model" />
<MetricsStrip items={[{ label: 'Markets', value: '10+'}, { label: 'Squads', value: '15'}]} />
```

## Validation

- Local: `npm run validate:campaigns` (or `pnpm run validate:campaigns`)
- CI: the script fails with a non‑zero exit if any campaign frontmatter violates the schema.

## Notes

- Do not place PII in frontmatter.
- Keep copy in content blocks; use frontmatter for configuration and layout parameters only.
