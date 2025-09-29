// Integration tests for Cache Invalidation - Step 8

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { invalidateBrandCache } from '@/lib/job_postings/cache'
import { storeJobPosting } from '@/lib/job_postings/storage'
import { extractFileMetadata } from '@/lib/job_postings/metadata'
import { normalizeContent } from '@/lib/job_postings/normalizer'
import { extractSemanticData } from '@/lib/job_postings/extractor'
import { generateEmbeddings } from '@/lib/job_postings/embeddings'

describe('Cache Invalidation - Step 8', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const testIds: string[] = []
  const testBrand = 'cache-test-brand'

  afterAll(async () => {
    // Cleanup test records
    if (testIds.length > 0) {
      await supabase
        .from('job_postings')
        .delete()
        .in('id', testIds)
    }
  })

  test('invalidates cache for brand', async () => {
    // Create a test job posting
    const metadata = extractFileMetadata(`${testBrand}-20250129T230800Z.md`)
    const normalized = normalizeContent('# Test Cache Invalidation')
    const extracted = await extractSemanticData(normalized.normalized, true)
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
    
    const result = await storeJobPosting(metadata, normalized, extracted, embeddings)
    expect(result.success).toBe(true)
    
    if (result.success) {
      testIds.push(result.id)
      
      // Set cache values
      await supabase
        .from('job_postings')
        .update({
          cache_key: 'test-cache-key',
          cache_expires_at: new Date(Date.now() + 86400000).toISOString()
        })
        .eq('id', result.id)
      
      // Verify cache is set
      const { data: before } = await supabase
        .from('job_postings')
        .select('cache_key, cache_expires_at')
        .eq('id', result.id)
        .single()
      
      expect(before?.cache_key).toBe('test-cache-key')
      expect(before?.cache_expires_at).toBeTruthy()
      
      // Invalidate cache
      await invalidateBrandCache(testBrand)
      
      // Verify cache is cleared
      const { data: after } = await supabase
        .from('job_postings')
        .select('cache_key, cache_expires_at')
        .eq('id', result.id)
        .single()
      
      expect(after?.cache_key).toBeNull()
      expect(after?.cache_expires_at).toBeNull()
    }
  }, 30000)

  test('handles non-existent brand gracefully', async () => {
    // Should not throw error
    await expect(
      invalidateBrandCache('non-existent-brand-xyz')
    ).resolves.not.toThrow()
  }, 30000)

  test('invalidates cache for multiple job postings of same brand', async () => {
    // Create two job postings for the same brand
    const brand = 'multi-cache-test'
    
    const metadata1 = extractFileMetadata(`${brand}-20250129T230801Z.md`)
    const normalized1 = normalizeContent('# Test 1')
    const extracted1 = await extractSemanticData(normalized1.normalized, true)
    const embeddings1 = await generateEmbeddings(normalized1.normalized, extracted1, true)
    
    const result1 = await storeJobPosting(metadata1, normalized1, extracted1, embeddings1)
    expect(result1.success).toBe(true)
    if (result1.success) testIds.push(result1.id)
    
    const metadata2 = extractFileMetadata(`${brand}-20250129T230802Z.md`)
    const normalized2 = normalizeContent('# Test 2')
    const extracted2 = await extractSemanticData(normalized2.normalized, true)
    const embeddings2 = await generateEmbeddings(normalized2.normalized, extracted2, true)
    
    const result2 = await storeJobPosting(metadata2, normalized2, extracted2, embeddings2)
    expect(result2.success).toBe(true)
    if (result2.success) testIds.push(result2.id)
    
    // Set cache for both
    if (result1.success && result2.success) {
      await supabase
        .from('job_postings')
        .update({
          cache_key: 'test-cache',
          cache_expires_at: new Date(Date.now() + 86400000).toISOString()
        })
        .in('id', [result1.id, result2.id])
      
      // Invalidate cache for the brand
      await invalidateBrandCache(brand)
      
      // Verify both are cleared
      const { data } = await supabase
        .from('job_postings')
        .select('cache_key, cache_expires_at')
        .in('id', [result1.id, result2.id])
      
      expect(data).toBeDefined()
      data?.forEach(row => {
        expect(row.cache_key).toBeNull()
        expect(row.cache_expires_at).toBeNull()
      })
    }
  }, 30000)

  test('logs invalidation', async () => {
    // Capture console.log
    const logs: string[] = []
    const originalLog = console.log
    console.log = (...args) => {
      logs.push(args.join(' '))
      originalLog(...args)
    }
    
    await invalidateBrandCache('test-logging')
    
    console.log = originalLog
    
    expect(logs.some(log => log.includes('Invalidating cache'))).toBe(true)
    expect(logs.some(log => log.includes('test-logging'))).toBe(true)
  }, 30000)
})
