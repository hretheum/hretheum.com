# Operations & Security Playbook

## Secrets Management
- Do not commit `.env`; keep repo private.
- Use project-level env vars and Vercel secrets.

## PII & Compliance
- Avoid storing sensitive PII in sources or chat logs; redact if necessary.

## Rate Limits & Reliability
- Graceful handling of 429 with retries/backoff.
- Consider paid credits for continuous access; monitor gateway metrics.

## Logging
- Log minimal metadata (timestamps, status) without storing user PII.
