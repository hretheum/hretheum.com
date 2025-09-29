// Integration tests for Suggestion Cache - Step 5

import { config } from 'dotenv'
import path from 'path'
import { describe, test, expect, beforeAll } from 'vitest'
import { getCachedSuggestions, setCachedSuggestions, invalidateBrandSuggestionCache } from '@/lib/job_postings/suggestion_cache'
import type { GeneratedSuggestions } from '@/lib/job_postings/suggestion_generator'

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

const mockSuggestions: GeneratedSuggestions = {
  suggestions: ['Question 1', 'Question 2', 'Question 3'],
  context_hash: 'test-hash-123',
  generated_at: new Date(),
  model: 'gpt-4o-mini',
}

describe('Suggestion Cache - Step 5', () => {
  const testBrand = 'cache-test-brand'
  
  test('caches and retrieves suggestions', async () => {
    await setCachedSuggestions(testBrand, mockSuggestions, 24)
    
    const cached = await getCachedSuggestions(testBrand, 'test-hash-123')
    
    expect(cached).toBeDefined()
    expect(cached?.suggestions).toEqual(['Question 1', 'Question 2', 'Question 3'])
    expect(cached?.context_hash).toBe('test-hash-123')
    expect(cached?.model).toBe('gpt-4o-mini')
    expect(cached?.hit_count).toBeGreaterThanOrEqual(0)
  }, 30000)
  
  test('returns null for cache miss', async () => {
    const cached = await getCachedSuggestions('non-existent-brand', 'xyz')
    expect(cached).toBeNull()
  }, 30000)
  
  test('increments hit count on cache hit', async () => {
    const uniqueHash = `test-hash-${Date.now()}`
    const suggestions = { ...mockSuggestions, context_hash: uniqueHash }
    
    await setCachedSuggestions(testBrand, suggestions, 24)
    
    const cached1 = await getCachedSuggestions(testBrand, uniqueHash)
    const hitCount1 = cached1?.hit_count || 0
    
    const cached2 = await getCachedSuggestions(testBrand, uniqueHash)
    const hitCount2 = cached2?.hit_count || 0
    
    expect(hitCount2).toBeGreaterThan(hitCount1)
  }, 30000)
  
  test('invalidates brand cache', async () => {
    await setCachedSuggestions(testBrand, mockSuggestions, 24)
    
    // Verify cached
    let cached = await getCachedSuggestions(testBrand, 'test-hash-123')
    expect(cached).toBeDefined()
    
    // Invalidate
    await invalidateBrandSuggestionCache(testBrand)
    
    // Verify cleared
    cached = await getCachedSuggestions(testBrand, 'test-hash-123')
    expect(cached).toBeNull()
  }, 30000)
  
  test('cache key has correct format', async () => {
    const uniqueHash = `test-hash-${Date.now()}`
    const suggestions = { ...mockSuggestions, context_hash: uniqueHash }
    
    await setCachedSuggestions(testBrand, suggestions, 24)
    
    const cached = await getCachedSuggestions(testBrand, uniqueHash)
    
    if (cached) {
      expect(cached.cache_key).toBeDefined()
      expect(cached.cache_key).toContain(testBrand)
      expect(cached.cache_key).toContain(uniqueHash)
    }
  }, 30000)
})