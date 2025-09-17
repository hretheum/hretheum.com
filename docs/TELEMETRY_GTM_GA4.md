# Chat Telemetry via GTM → GA4 (Step‑by‑Step)

This guide explains how to track the custom chat widget events with Google Tag Manager (GTM) and Google Analytics 4 (GA4). The implementation in the app uses `dataLayer.push` and a hub event `chat_interaction` with low‑cardinality parameters. No message text (PII) is sent.

## Prerequisites
- Production site deployed and accessible.
- GTM container (e.g., `GTM-XXXXXXX`).
- GA4 property connected to the GTM container.

## 1) Verify code instrumentation
The chat widget (`app/components/RagChat.tsx`) pushes the following events:
- `chat_interaction` with parameter `chat_action = chat_open` (once per session)
- `chat_interaction` with parameter `chat_action = chat_message_sent`, plus `message_len` (characters)
- `chat_interaction` with parameter `chat_action = chat_close`

Shared parameters:
- `chat_widget` (fixed: `custom-react`)
- `chat_variant` (from `NEXT_PUBLIC_CHAT_VARIANT`, defaults to `default`)

Feature flag to disable telemetry at runtime:
- `NEXT_PUBLIC_ENABLE_GTM` (disable by setting to `false`)

GTM is injected globally in `app/layout.tsx` (Tag Manager script + noscript fallback). No additional code steps are required here.

## 2) Configure GTM (Variables, Trigger, Tag)
Perform these actions in the GTM UI.

1) Create Data Layer Variables (Data Layer Variable type):
- `chat_action`
- `message_len`
- `chat_widget`
- `chat_variant`

2) Create a Trigger:
- Type: Custom Event
- Event name: `chat_interaction`
- This trigger will fire the GA4 event tag whenever the chat sends interaction data.

3) Create a Tag (GA4 Event):
- Tag type: Google Analytics: GA4 Event
- Configuration: Select your GA4 configuration tag
- Event name: `chat_interaction`
- Event parameters (add rows and map to Data Layer Variables):
  - `chat_action` → {{chat_action}}
  - `message_len` → {{message_len}}
  - `chat_widget` → {{chat_widget}}
  - `chat_variant` → {{chat_variant}}
- Triggering: the Custom Event trigger `chat_interaction`

Publish the GTM container when you are done testing.

## 3) GA4: Custom definitions and (optional) Key Events
In GA4 Admin → Custom definitions:
- Add Custom dimensions for:
  - `chat_action` (Event scope)
  - `chat_variant` (Event scope)
- (Optional) Add a Custom metric for `message_len` if you want it aggregated as a metric. Otherwise, you can analyze it in Explore.

(Optional) In GA4 Admin → Events, mark `chat_interaction` as a Key event (Conversion) depending on your KPIs. You can also define a separate tag with event name `chat_message_sent` if you prefer a dedicated conversion event.

## 4) QA and Debug
- Use GTM Preview mode on your site:
  - Open chat → expect one `chat_interaction` with `chat_action=chat_open`.
  - Send a message → `chat_interaction` with `chat_action=chat_message_sent`, `message_len`.
  - Close chat → `chat_interaction` with `chat_action=chat_close`.
- In GA4 DebugView (and Realtime) confirm events and parameters.

## 5) Notes & Limits
- GA4 limits: event name ≤ 40 chars; ≤ 25 params per event → we fit comfortably.
- No PII is sent (no message content). Only length is recorded.
- CSP: allow scripts for `https://www.googletagmanager.com` and `https://www.google-analytics.com`.

## 6) (Optional) Server‑side events
If later you need to enrich tracking from the backend (e.g., aggregate statuses), you can use GA4 Measurement Protocol. Keep event names/params consistent with the web events so reporting unifies. See Google docs for rate limits and parameter caps.
