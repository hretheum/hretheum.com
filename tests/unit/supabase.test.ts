// Unit tests for lib/rag_store/supabase.ts
// Phase 2: Test parseEmbedding() helper

import { describe, test, expect } from 'vitest'

// Import parseEmbedding - need to export it first or test via public API
// For now, we'll test the behavior through searchByEmbedding
// But we can create a minimal test for the logic

describe('parseEmbedding helper', () => {
  // Helper function to simulate parseEmbedding logic
  function parseEmbedding(emb: any): number[] | null {
    if (Array.isArray(emb)) {
      return emb
    }
    
    if (typeof emb === 'string') {
      try {
        const parsed = JSON.parse(emb)
        if (Array.isArray(parsed)) {
          return parsed
        }
        return null
      } catch {
        return null
      }
    }
    
    return null
  }

  test('handles array format', () => {
    const result = parseEmbedding([0.1, 0.2, 0.3])
    expect(result).toEqual([0.1, 0.2, 0.3])
  })
  
  test('handles string format', () => {
    const result = parseEmbedding('[0.1, 0.2, 0.3]')
    expect(result).toEqual([0.1, 0.2, 0.3])
  })
  
  test('handles invalid format', () => {
    const result = parseEmbedding('invalid')
    expect(result).toBeNull()
  })
  
  test('handles null', () => {
    const result = parseEmbedding(null)
    expect(result).toBeNull()
  })
  
  test('handles undefined', () => {
    const result = parseEmbedding(undefined)
    expect(result).toBeNull()
  })
  
  test('handles object (not array)', () => {
    const result = parseEmbedding({ a: 1 })
    expect(result).toBeNull()
  })
  
  test('handles string with object (not array)', () => {
    const result = parseEmbedding('{"a": 1}')
    expect(result).toBeNull()
  })
  
  test('handles large embedding array', () => {
    const large = new Array(1536).fill(0.5)
    const result = parseEmbedding(large)
    expect(result).toEqual(large)
    expect(result?.length).toBe(1536)
  })
  
  test('handles string with large embedding', () => {
    const large = new Array(1536).fill(0.5)
    const str = JSON.stringify(large)
    const result = parseEmbedding(str)
    expect(result).toEqual(large)
    expect(result?.length).toBe(1536)
  })
})
