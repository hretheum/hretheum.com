# AUI System Documentation

## Overview

AUI (Adaptive UI) is a hybrid system combining deterministic rules with lightweight AI to provide contextual micro-adaptations on brand/campaign pages.

## Architecture

### Components

- **Rules Engine** (`lib/rules/`): Deterministic condition → action mapping
- **LLM Policy** (`lib/llm/`): Constrained AI for dynamic decisions
- **Session Interpreter** (`app/api/session/interpreter/`): Shadow analysis of conversations
- **Industry Classifier** (`lib/industry_server.ts`): Runtime brand → industry mapping
- **Feature Flags** (`lib/featureFlags.ts`): SSR-safe configuration system

### Data Flow

1. **Page Load**: `resolveIndustrySSR()` → industry + confidence
2. **CSR Rules**: `useAdaptiveRules()` → effects based on context
3. **LLM Shadow**: Session interpreter analyzes conversations in background
4. **Telemetry**: All interactions tracked with consent gating

## Configuration

### Environment Variables

```bash
# Core AUI
NEXT_PUBLIC_RULES_AI_ENABLED=true
RULES_AI_ENABLED=true
RULES_AI_ALLOWED_ACTIONS=ui.show_suggestions,ui.tooltip,ui.show_how_it_works,ui.novice_disclosure

# Safe Actions (brand pages)
NEXT_PUBLIC_RULES_CSR_SUGGESTED_QUERIES=true
NEXT_PUBLIC_RULES_AI_DEMO=true

# Advanced
NEXT_PUBLIC_TELEMETRY_DEBUG=true
NEXT_PUBLIC_CHAOS_MODE=false
```

### Rules Configuration

Rules defined in `config/rules.ts`:

```typescript
export const ssrRules = [
  {
    id: 'hero_cta_variant',
    conditions: [(ctx) => ctx.industry === 'DigitalTech'],
    actions: [(ctx) => ({ hero: { ctaLabel: 'Schedule Call' } })]
  }
]
```

## Rollback Procedures

### Emergency Kill-Switch

1. **Disable All AUI**:
   ```bash
   # Set in Vercel Dashboard
   NEXT_PUBLIC_RULES_AI_ENABLED=false
   RULES_AI_ENABLED=false
   ```

2. **Disable Specific Actions**:
   ```bash
   RULES_AI_ALLOWED_ACTIONS=ui.none
   ```

3. **Force Industry to Generic**:
   ```bash
   INDUSTRY_AUTOPROMOTE_ENABLED=false
   ```

### Gradual Rollback

1. **Shadow Mode**:
   ```bash
   RULES_AI_SHADOW_ONLY=true  # Log only, no UI changes
   ```

2. **Feature Flag Rollback**:
   ```bash
   NEXT_PUBLIC_RULES_CSR_SUGGESTED_QUERIES=false
   ```

3. **Industry Fallback**:
   ```bash
   INDUSTRY_DUMMY_CONF_MAX=1.0  # Force Dummy for all unknown
   ```

### Monitoring Points

- **Error Rates**: `/api/admin/redirects` p95/p50
- **User Engagement**: GTM events `suggested_queries_*`
- **Performance**: RUM dashboard CWV metrics
- **AI Costs**: LLM usage in `industry_resolution_events`

## Troubleshooting

### Common Issues

1. **No Suggested Queries**:
   - Check `NEXT_PUBLIC_RULES_CSR_SUGGESTED_QUERIES=true`
   - Verify industry resolution in `/api/admin/industry/debug`
   - Check consent banner settings

2. **Tooltip Not Showing**:
   - Verify hesitation detection works
   - Check `NEXT_PUBLIC_RULES_ENABLED=true`
   - Review rules in `config/rules.ts`

3. **Industry Classification Issues**:
   - Check `/api/admin/industry/debug?slug=<brand>&secret=<secret>`
   - Review `brand_industries.json` mappings
   - Check LLM timeout/costs

### Debug Commands

```bash
# Test industry classification
curl "http://localhost:3000/api/admin/industry/debug?slug=testbrand&secret=dev"

# Check RUM metrics
curl "http://localhost:3000/api/admin/rum?days=1"

# Validate campaigns
npm run validate:campaigns

# Run accessibility audit
npm run a11y:audit
```

## Security Considerations

- **Consent Gating**: All behavioral tracking requires explicit consent
- **Rate Limiting**: Unknown brands limited to 10 req/min per IP
- **PII Protection**: No raw user data in telemetry
- **LLM Safety**: Constrained prompts, timeouts, cost caps
- **Rollback Ready**: All features can be disabled via env vars

## Performance Impact

- **SSR**: Industry classification adds ~100-300ms to page load
- **CSR**: Rules engine runs in ~10-50ms
- **Bundle**: AUI components add ~15KB gzipped
- **Network**: Shadow interpreter adds minimal background requests

## Future Enhancements

- **A/B Testing**: SSR flag framework ready for experiments
- **Advanced LLM**: Session interpreter can be promoted from shadow
- **Real-time**: WebSocket support for live adaptations
- **Analytics**: Enhanced cohort analysis in admin dashboard