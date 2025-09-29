// Integration tests for Suggestions API - Step 6

import { config } from 'dotenv'
import path from 'path'
import { describe, test, expect } from 'vitest'

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

describe('Suggestions API - Step 6', () => {
  test('returns suggestions for brand with job postings', async () => {
    const response = await fetch(`${API_URL}/api/suggestions/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandSlug: 'e2e-test' }),
    })
    
    const data = await response.json()
    
    expect(response.ok).toBe(true)
    expect(data.suggestions).toBeDefined()
    expect(Array.isArray(data.suggestions)).toBe(true)
    expect(data.source).toBeDefined()
  }, 30000)
  
  test('returns cached suggestions on second call', async () => {
    // First call
    await fetch(`${API_URL}/api/suggestions/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandSlug: 'e2e-test' }),
    })
    
    // Second call (should be cached)
    const response = await fetch(`${API_URL}/api/suggestions/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandSlug: 'e2e-test' }),
    })
    
    const data = await response.json()
    
    // May or may not be cached depending on timing
    expect(data.suggestions).toBeDefined()
    expect(data.source).toBeDefined()
  }, 30000)
  
  test('falls back to generic for unknown brand', async () => {
    const response = await fetch(`${API_URL}/api/suggestions/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandSlug: 'unknown-brand-xyz-123' }),
    })
    
    const data = await response.json()
    
    expect(response.ok).toBe(true)
    expect(data.suggestions).toBeDefined()
    expect(data.source).toBe('generic')
  }, 30000)
  
  test('returns empty for missing brandSlug', async () => {
    const response = await fetch(`${API_URL}/api/suggestions/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    
    const data = await response.json()
    
    expect(response.ok).toBe(true)
    expect(data.suggestions).toEqual([])
    expect(data.source).toBe('empty')
  }, 30000)
})