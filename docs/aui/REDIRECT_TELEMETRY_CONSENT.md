# Redirect Telemetry & Consent Handling

Status: Draft (for review)
Last updated: 2025-09-22

See also: [AUI Task DAG](./AUI_DAG.md).

This document describes how redirect telemetry (subdomain → canonical brand route) is implemented, how consent gating works, and how to operate/debug it. It complements the Consent vs Signal Matrix.

## Goals
- Capture a minimal signal that a user arrived via an employer-oriented subdomain (e.g., `brand.hretheum.com`) and was canonicalized to `https://hretheum.com/brand/<slug>`.
- Respect consent policies: do not emit analytics without explicit consent unless strictly necessary for service.
- Provide lightweight performance visibility (middleware latency) without degrading UX.

## Components
- `middleware.ts`
  - Detects brand subdomains and issues a 301 to the apex domain: `/brand/<slug>`.
  - Sets a short-lived cookie `hre_rsrc` on the apex domain carrying a minimal, non-PII payload:
    - `h`: source host (e.g., `brand.hretheum.com`)
    - `s`: normalized slug (e.g., `brand`), may be empty for invalid/unknown
    - `t`: timestamp (ms)
    - `m`: middleware duration (ms), also sent in `Server-Timing: mw;dur=<ms>`
  - Cookie attributes: `domain=<APEX>`, `path=/`, `secure`, `samesite=lax`, `max-age=300`, not HttpOnly (client can read to trigger the beacon).

- `app/brand/[slug]/RedirectBeacon.tsx`
  - Client-only component mounted on `/brand/<slug>` and `/brand` pages.
  - On mount, and on consent changes, sends a `POST` to `POST /api/metrics/redirect` exactly once.
  - Consent gating:
    - Controlled by env `NEXT_PUBLIC_REDIRECT_BEACON_REQUIRES_CONSENT` (default `true`).
    - When gating is on, the beacon checks cookie `NEXT_PUBLIC_CONSENT_COOKIE_NAME` (default `hre_consent_analytics`); accepted values: `1` or `true`.
    - If no consent, beacon does nothing.
  - Consent change detection:
    - Listens to custom events: `hre:consent-changed` and `consent-changed` (dispatch from your consent manager once user toggles consent).
    - Polling fallback for up to 2 minutes (interval 1.5s) to catch consent being set shortly after landing.

- `POST /api/metrics/redirect`
  - Reads and clears the `hre_rsrc` cookie.
  - Inserts a row into `redirect_events` with the minimal payload: `source_host`, `dest_slug`, `referer`, `user_agent`, and `meta.mw_ms` (if present).
  - Write-only for runtime via RLS (INSERT allowed for anon/auth; SELECT denied by default).

- `redirect_events` (Supabase/Postgres)
  - Schema: `id uuid`, `created_at timestamptz`, `source_host text`, `dest_slug text`, `referer text`, `user_agent text`, `meta jsonb` (optional: `{ mw_ms: number }`).
  - Migrations: `0007_redirect_events.sql`, `0008_redirect_events_meta.sql`.

- Admin dashboards
  - `GET /api/admin/redirects`: aggregates for a time window (default 7 days): `total`, `bySlug`, `bySource`, `byDay` and latency stats `mwStats { count, p50, p95 }`.
  - `GET /api/admin/redirects/raw`: paginated raw rows with filters (slug, host, since, until).
  - UI: `/admin?tab=redirects` shows both dashboard and raw table.

## Consent Configuration
- Env vars (public):
  - `NEXT_PUBLIC_APEX_DOMAIN=hretheum.com`
  - `NEXT_PUBLIC_REDIRECT_BEACON_REQUIRES_CONSENT=true`
  - `NEXT_PUBLIC_CONSENT_COOKIE_NAME=hre_consent_analytics`
- Setting consent cookie manually (for testing) on `hretheum.com`:
  ```js
  document.cookie = "hre_consent_analytics=1; path=/; domain=hretheum.com; max-age=31536000; secure; samesite=lax";
  ```
- Consent manager Integration:
  - After user grants or revokes consent, dispatch an event:
  ```js
  window.dispatchEvent(new Event('hre:consent-changed'));
  // or a generic name supported by your CMP
  window.dispatchEvent(new Event('consent-changed'));
  ```

## Edge Cases & Behavior
- No consent: beacon remains silent; 301 still happens (necessary routing) but no row is written.
- Consent granted after landing: beacon will send once upon detecting consent via event or polling (up to 2 minutes), then stop.
- Multiple refreshes: the `hre_rsrc` cookie is cleared by the server after first POST; no duplicates.
- Bot/crawler: no client beacon (CSR), so no row is written.
- Adblocker blocks POST: event may be lost; dashboard reflects only successful POSTs.
- Exceptions (e.g., subdomains mapped to Gamma): requests never reach our app, no middleware → no telemetry.

## Privacy Notes
- Payload is minimal and contains no PII; `referer` and `user_agent` are stored for diagnostics. IP is not stored; use server logs if necessary for abuse/security with short retention.
- This aligns with the Consent vs Signal Matrix: redirect telemetry is consent-gated by default.

## Operations Checklist
- DNS: wildcard `*.hretheum.com` routes to Vercel project; exceptions mapped explicitly elsewhere.
- Env: set `NEXT_PUBLIC_*` vars; list admin emails in `ADMIN_EMAILS`.
- DB: apply migrations `0007` and `0008`.
- Verify: hit `https://random.hretheum.com` → 301 → `/brand/random`; set consent → POST fired; `/admin?tab=redirects` shows data.

## Future Enhancements
- Server-side consent verification in `POST /api/metrics/redirect` (second safety net) if required.
- Enrich with per-brand campaigns and cohorting (still non-PII) if policy permits.
- Optional server-timing sampling for more granular latency analysis.
