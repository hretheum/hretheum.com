# AUI Rollback Playbook

## Overview

This document provides step-by-step procedures for rolling back AUI features in case of issues, performance problems, or security concerns.

## Emergency Contacts

- **Dev Lead**: [Contact info]
- **SRE**: [Contact info]
- **Product**: [Contact info]

## Rollback Levels

### Level 1: Disable Specific Actions (5 minutes)

**When**: Minor issues with specific features

**Actions**:

1. **Disable Suggested Queries**:
   ```bash
   # Vercel Dashboard → Environment Variables
   NEXT_PUBLIC_RULES_CSR_SUGGESTED_QUERIES=false
   ```

2. **Disable Tooltips**:
   ```bash
   RULES_AI_ALLOWED_ACTIONS=ui.show_how_it_works,ui.novice_disclosure
   ```

3. **Disable Chaos Mode**:
   ```bash
   NEXT_PUBLIC_CHAOS_MODE=false
   ```

4. **Redeploy** automatically triggered

**Verification**: Check `/brand/<slug>` - disabled features should not appear

### Level 2: Shadow Mode (2 minutes)

**When**: Issues with AI decisions but want to keep logging

**Actions**:

1. **Enable Shadow Mode**:
   ```bash
   RULES_AI_SHADOW_ONLY=true
   ```

2. **Keep Logging**:
   ```bash
   NEXT_PUBLIC_TELEMETRY_DEBUG=true
   ```

3. **Redeploy**

**Verification**: Features disabled in UI but logging continues

### Level 3: Disable All AUI (1 minute)

**When**: Major issues, performance problems, or security concerns

**Actions**:

1. **Kill All AUI**:
   ```bash
   NEXT_PUBLIC_RULES_AI_ENABLED=false
   RULES_AI_ENABLED=false
   NEXT_PUBLIC_RULES_CSR_SUGGESTED_QUERIES=false
   NEXT_PUBLIC_CHAOS_MODE=false
   ```

2. **Force Generic Industry**:
   ```bash
   INDUSTRY_AUTOPROMOTE_ENABLED=false
   INDUSTRY_DUMMY_CONF_MAX=1.0
   ```

3. **Redeploy**

**Verification**:
- All AUI components should be hidden
- Industry should fallback to Generic
- No LLM calls should be made

### Level 4: Complete System Reset (10 minutes)

**When**: Critical failure requiring full reset

**Actions**:

1. **Database Reset** (if needed):
   ```sql
   -- Clear AUI data
   DELETE FROM industry_resolution_events WHERE created_at > NOW() - INTERVAL '1 hour';
   DELETE FROM brand_industry_suggestions WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

2. **Cache Purge**:
   ```bash
   # Vercel Dashboard → Deployments → Purge Cache
   ```

3. **CDN Purge** (if applicable):
   ```bash
   # Cloudflare/other CDN purge
   ```

4. **Monitor** for 30 minutes

## Rollback Verification

### Automated Checks

1. **Build Test**:
   ```bash
   npm run build
   ```

2. **E2E Tests**:
   ```bash
   npm run test:e2e
   ```

3. **Accessibility Audit**:
   ```bash
   npm run a11y:audit
   ```

### Manual Checks

1. **Brand Pages**:
   - `/brand/tmobile` - no AUI elements
   - `/brand/codeandpepper` - generic industry
   - `/brand/fluxon` - fallback behavior

2. **Admin Dashboard**:
   - `/admin?tab=conversations` - normal operation
   - `/admin?tab=industry` - only deterministic mappings

3. **Performance**:
   - RUM dashboard shows normal metrics
   - No LLM-related errors in logs

## Communication Plan

### Internal Notification

1. **Slack Channels**:
   - `#dev-alerts`
   - `#product-updates`

2. **Email**:
   - Dev team
   - Product team
   - SRE team

### User Communication

- **Status Page**: Update if major issues
- **Support**: Notify if user-facing features affected

## Prevention

### Pre-Deployment Checks

1. **Staging Validation**:
   - Test all scenarios on staging
   - Performance benchmarks
   - Accessibility audit

2. **Gradual Rollout**:
   - Start with 10% traffic
   - Monitor for 24 hours
   - Gradually increase to 100%

3. **Kill Switches Ready**:
   - All rollback procedures tested
   - Emergency contacts available
   - Documentation up to date

## Metrics to Monitor Post-Rollback

- **Error Rates**: Should return to baseline
- **Performance**: LCP/CLS/INP should improve
- **User Engagement**: May decrease temporarily
- **Support Tickets**: Monitor for user confusion

## Lessons Learned

Document what went wrong and how to prevent in future:
- [ ] Update this playbook
- [ ] Review monitoring thresholds
- [ ] Consider additional safety measures

## Related Documentation

- [AUI System Docs](./AUI_SYSTEM_DOCS.md)
- [Rules Engine Plan](./T14-rules-engine-plan.md)
- [Industry Classifier Debug](./INDUSTRY_CLASSIFIER_DEBUG.md)