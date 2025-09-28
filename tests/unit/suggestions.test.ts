import { describe, it, expect } from 'vitest'
import { getSuggestedQueries } from '@/lib/suggestions'
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
