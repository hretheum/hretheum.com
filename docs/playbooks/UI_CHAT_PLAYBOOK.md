# Chat UI Playbook

Guidelines for presenting answers and citations cleanly.

## Rendering
- Use `react-markdown` + `remark-gfm` with Tailwind Typography (`prose`).
- Avoid tables unless required; prefer short paragraphs and bullets.

## Sources Block
- Render as list: italic short quote (~≤180 chars) + bold source name + optional link.
- Strip markdown artifacts from quotes before display.

## Confidence UX
- Show subtle badge for low-confidence only if all retrieval fallbacks fail.
- Offer suggested refinements (chips) to guide more specific queries.

## Widget Behavior
- Bottom-right pinned widget, compact mobile mode.
- Minimize via header button and ESC; restore via FAB.
- Persist `ragChatMinimized` and `ragChatDraft` in `localStorage`.

## Optional Enhancements
- Streaming tokens in the UI, message history pagination, keyboard shortcut (Shift+ESC) to restore.
