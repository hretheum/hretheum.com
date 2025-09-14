# AI Gateway Playbook

Best practices for using Vercel AI Gateway (OpenAI-compatible).

## Client Setup
- Use official `openai` client.
- Prefer `AI_GATEWAY_API_KEY` with `baseURL=https://ai-gateway.vercel.sh/v1`.
- Fallback to `OPENAI_API_KEY` without baseURL when gateway key missing.

## Models & Aliases
- `AI_MODEL_GENERATION=openai/gpt-oss-120b` (example default).
- `AI_MODEL_EMBEDDINGS=openai/text-embedding-3-small`.
- Hot-swap models via ENV; no code changes required.

## Caching & Routing (Optional)
- Enable caching for system prompts and tool specs.
- Configure provider routing order for cost/latency tradeoffs.

## Observability
- Monitor latency, error codes, model usage.
- Handle 429 with small retries/backoff; consider paid credits for sustained traffic.
