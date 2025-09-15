# Admin Console Plan — Conversation Logging and Review

## 1) Overview
This document defines the plan to persist chat conversations and expose a secure, web-based admin console at `/_admin` to review user questions and system telemetry. The admin console is protected by Google login (Supabase Auth) and a strict email allowlist.

- Admin allowlist: eof@offline.pl
- Data store: Supabase (Postgres)
- Primary table: `public.chat_events`
- Privacy posture: write-only for runtime; read access is restricted to authenticated admins via API gating.

## 2) Scope
- Persist user/assistant messages and execution telemetry per turn.
- Expose a paginated admin endpoint: `GET /api/admin/events`.
- Build a minimal admin UI at `/_admin` (login-gated) to list/filter events.
- Include diagnostic fields: resolved intent, confidence, phase timings, and environment metadata (User-Agent, IP if available).

Out of scope (future): dashboards, export to BI, PII redaction UI, per-session replay.

## 3) Data Model (Supabase)
Table: `public.chat_events`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`
- `session_id text not null` — stable, anonymous session identifier (cookie-based)
- `type text not null` — enum-like: `user_message` | `assistant_answer`
- `message text not null` — user or assistant textual content
- `intent text null` — intent id (for `user_message` after classification)
- `confidence double precision null` — classifier confidence [0..1]
- `timings jsonb null` — `{ embed_ms, prf_seed_ms, hybrid_rpc_ms, selection_mmr_ms, llm_answer_ms, total_ms }`
- `meta jsonb null` — `{ user_agent, referer, ip, lowConfidence, selectedCount, top1Boosted }`
- Indexes: `created_at`, `session_id`, optional GIN on `meta`

Security (RLS):
- RLS: ON
- Policy INSERT: allow `anon, authenticated` (runtime write-only)
- Policy SELECT: deny by default; the app backend uses service role on the server OR restricts via API allowlist and user session checks (recommended: restrict at API layer using Supabase Auth user email allowlist).

## 4) Authentication & Authorization
- Provider: Supabase Auth with Google OAuth.
- Admin allowlist via environment variable `ADMIN_EMAILS` (comma-separated), e.g. `ADMIN_EMAILS=eof@offline.pl`.
- Admin UI flow:
  - If not authenticated: show "Sign in with Google".
  - If authenticated: verify `user.email ∈ ADMIN_EMAILS`; otherwise show 403 page.

## 5) Backend Changes
- `app/api/rag/query/route.ts` (server-side logging):
  - On request start: upsert/generate cookie `chat_session_id` if missing.
  - Insert `chat_events` row with `type='user_message'`, `message`, `session_id`, `meta.user_agent`, `meta.referer`, optional `meta.ip` from headers.
  - After `classifyIntent`: update same row (or insert second row) with `intent`, `confidence`.
  - On completion: update row with `timings`, `meta.lowConfidence`, `meta.selectedCount`, `meta.top1Boosted`.
  - Option A (simpler): single row per user turn (user message) enriched over time.
  - Option B: two rows per turn (user_message, assistant_answer). MVP: Option A.

Implementation details:
- Session ID: `getOrCreateSessionId()`
  - Read from HTTP-only, same-site cookie `chat_session_id`; if absent, generate UUID v4 and set cookie.
- IP extraction: `x-forwarded-for` (first IP) or `x-real-ip`; store only if present.
- Error handling: best-effort logging (errors ignored to not impact UX).

## 6) Admin API
Endpoint: `GET /api/admin/events`

- Auth: Supabase Auth (server-side), reject if no session.
- Authorization: require `user.email ∈ ADMIN_EMAILS`.
- Query params: `limit` (default 50, max 200), `offset` (default 0), optional `q` to search `message`.
- Response: JSON `{ items: [...], total: <int> }`.
- Ordering: `created_at DESC`.

## 7) Admin UI (`/_admin`)
- Auth gate: if unauthenticated, render Sign-In with Google (Supabase Auth client).
- On success and allowlist pass: fetch `/api/admin/events?limit=50` and render table:
  - Columns: time, session_id, type, message (truncated), intent, confidence, total_ms, embed_ms, hybrid_rpc_ms, user_agent, ip.
  - Controls: pagination, basic filter by type/intent.

## 8) Metrics of Success (per task) & Validation

Task A — Persist events in DB
- Success:
  - ≥ 99% requests produce an INSERT row in `chat_events` within a rolling 24h sample.
  - Rows contain non-null `session_id`, `type`, `message`.
- Validation:
  - Run 20 smoke queries; verify `SELECT count(*) FROM chat_events WHERE created_at > now() - interval '10 minutes'` ≈ number of accepted requests.
  - Spot-check 3 rows for correct `intent`, `confidence`, and non-empty `timings.total_ms`.

Task B — Admin API (`/api/admin/events`)
- Success:
  - Returns 200 for admin user; 401/403 for non-authenticated/non-allowlisted.
  - Pagination stable: requesting `limit=50&offset=50` yields disjoint items relative to `offset=0`.
- Validation:
  - Integration tests (or manual): call as admin and as anon; confirm status codes and item counts.
  - Verify response payload contains expected fields and ordering.

Task C — Admin UI (`/_admin`)
- Success:
  - Unauthenticated users see a login screen; authenticated allowlisted users see a populated table.
  - Table renders last 50 events, supports paging.
- Validation:
  - Manual E2E: logout → visit `/_admin` → login with Google (allowlisted) → table visible.
  - Simulate non-allowlisted user → ensure 403 page.

Task D — Privacy & Security
- Success:
  - RLS enabled; INSERT allowed for runtime; SELECT not allowed via public anon.
  - Admin API enforces email allowlist; no client-side secrets exposed.
- Validation:
  - Attempt `curl` to `/api/admin/events` without auth → 401/403.
  - Attempt direct PostgREST read as `anon` (if exposed) → denied.

Task E — Telemetry Coverage
- Success:
  - For ≥ 95% user messages, `timings.total_ms` is present and > 0.
  - `meta.selectedCount` and `meta.top1Boosted` recorded on successful retrieval turns.
- Validation:
  - Sample 100 most recent events and compute coverage rate; check distribution of `total_ms` for sanity (no massive outliers except cold starts).

## 9) Rollout Plan
1) Create migration `0004_chat_events.sql` (table + indexes + RLS policies).
2) Implement server logging in `app/api/rag/query/route.ts` (best-effort writes).
3) Add admin endpoint `app/api/admin/events/route.ts` with allowlist.
4) Build `/_admin` page with Supabase Auth Google sign-in and basic table UI.
5) Configure ENV in Vercel:
   - `ADMIN_EMAILS=eof@offline.pl`
   - Google provider keys in Supabase (project settings) and Vercel env if needed for client usage.
6) Validate tasks A–E using the methods above.

## 10) Risks & Mitigations
- OAuth callback/domain mismatch → Ensure Supabase Auth redirect URLs include production and preview domains.
- PII concerns with IP/User-Agent → Restrict read access to admins; document retention policy (e.g., 30–90 days).
- Query costs in admin UI → Add pagination + server-side limits; consider indexes.

## 11) Open Questions
- Retention period for `chat_events` (default 90 days?)
- Need for export (CSV) endpoint for monthly reporting?
- Additional fields for session stitching (e.g., hashed cookie fingerprint)?
