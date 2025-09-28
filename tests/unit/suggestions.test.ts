import { describe, it, expect } from 'vitest'
import { getSuggestedQueries, getEnhancedSuggestedQueries } from '@/lib/suggestions'
import type { Industry } from '@/lib/industry'

describe('getSuggestedQueries', () => {
  it('returns 3+ safe suggestions for Generic without brand', () => {
    const out = getSuggestedQueries('Generic', undefined)
    expect(Array.isArray(out)).toBe(true)
    expect(out.length).toBeGreaterThanOrEqual(3)
    expect(out.every(s => typeof s === 'string' && s.length > 0)).toBe(true)
  })

  it('includes brand hint when provided', () => {
    const out = getSuggestedQueries('SaaS' as Industry, 'tmobile')
    expect(out.join('\n')).toContain('tmobile')
  })
})

describe('getEnhancedSuggestedQueries', () => {
  it('returns suggestions for brand with campaign', async () => {
    const out = await getEnhancedSuggestedQueries('Telecom' as Industry, 'tmobile')
    expect(Array.isArray(out)).toBe(true)
    expect(out.length).toBeGreaterThanOrEqual(3)
    expect(out.every(s => typeof s === 'string' && s.length > 0)).toBe(true)
    // Should include leadership/team-related questions for T-Mobile G2M Lead role
    expect(out.some(s => s.toLowerCase().includes('leadership') || s.toLowerCase().includes('team'))).toBe(true)
  })

  it('falls back to generic suggestions when no campaign found', async () => {
    const out = await getEnhancedSuggestedQueries('Generic' as Industry, 'nonexistent')
    expect(Array.isArray(out)).toBe(true)
    expect(out.length).toBeGreaterThanOrEqual(3)
  })
})
