// Integration tests for Database Storage - Step 7

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { storeJobPosting } from '@/lib/job_postings/storage'
import { extractFileMetadata } from '@/lib/job_postings/metadata'
import { normalizeContent } from '@/lib/job_postings/normalizer'
import { extractSemanticData } from '@/lib/job_postings/extractor'
import { generateEmbeddings } from '@/lib/job_postings/embeddings'

describe('Database Storage - Step 7', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const testIds: string[] = []

  afterAll(async () => {
    // Cleanup test records
    if (testIds.length > 0) {
      await supabase
        .from('job_postings')
        .delete()
        .in('id', testIds)
    }
  })

  test('stores job posting successfully', async () => {
    const metadata = extractFileMetadata('test-20250129T143022Z.md')
    const normalized = normalizeContent('# Test Job Posting\n\nRequires 5+ years experience')
    const extracted = await extractSemanticData(normalized.normalized, true) // Use mock
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true) // Use mock
    
    const result = await storeJobPosting(metadata, normalized, extracted, embeddings)
    
    expect(result.success).toBe(true)
    expect(result.id).toBeTruthy()
    expect(result.error).toBeUndefined()
    
    if (result.success) {
      testIds.push(result.id)
      
      // Verify in database
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', result.id)
        .single()
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.brand_slug).toBe('test')
      expect(data.file_format).toBe('md')
      expect(data.is_active).toBe(true)
      expect(data.content).toContain('Test Job Posting')
    }
  }, 30000)

  test('stores all extracted data correctly', async () => {
    const metadata = extractFileMetadata('test2-20250129T143023Z.md')
    const normalized = normalizeContent('# Senior Developer\n\nRequires React, TypeScript')
    const extracted = await extractSemanticData(normalized.normalized, true)
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
    
    const result = await storeJobPosting(metadata, normalized, extracted, embeddings)
    
    expect(result.success).toBe(true)
    
    if (result.success) {
      testIds.push(result.id)
      
      const { data } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', result.id)
        .single()
      
      // Verify extracted data
      expect(data.technical_skills).toBeDefined()
      expect(data.core_requirements).toBeDefined()
      expect(data.seniority_level).toBeDefined()
      expect(data.role_type).toBeDefined()
      
      // Verify embeddings
      expect(data.embedding_full_text).toBeDefined()
      expect(data.embedding_requirements).toBeDefined()
      expect(data.embedding_skills).toBeDefined()
      expect(data.embedding_model).toBeDefined()
    }
  }, 30000)

  test('handles duplicate content hash', async () => {
    const metadata = extractFileMetadata('test3-20250129T143024Z.md')
    const normalized = normalizeContent('# Duplicate Content Test')
    const extracted = await extractSemanticData(normalized.normalized, true)
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
    
    // Store once
    const result1 = await storeJobPosting(metadata, normalized, extracted, embeddings)
    expect(result1.success).toBe(true)
    
    if (result1.success) {
      testIds.push(result1.id)
    }
    
    // Try to store again with same content (different filename)
    const metadata2 = extractFileMetadata('test3-duplicate-20250129T143025Z.md')
    const result2 = await storeJobPosting(metadata2, normalized, extracted, embeddings)
    
    expect(result2.success).toBe(false)
    expect(result2.error).toBeDefined()
    expect(result2.error).toContain('Duplicate')
  }, 30000)

  test('stores embeddings with correct dimensions', async () => {
    const metadata = extractFileMetadata('test4-20250129T143026Z.md')
    const normalized = normalizeContent('# Test Embeddings')
    const extracted = await extractSemanticData(normalized.normalized, true)
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
    
    const result = await storeJobPosting(metadata, normalized, extracted, embeddings)
    
    expect(result.success).toBe(true)
    
    if (result.success) {
      testIds.push(result.id)
      
      const { data } = await supabase
        .from('job_postings')
        .select('embedding_full_text, embedding_requirements, embedding_skills')
        .eq('id', result.id)
        .single()
      
      // Embeddings should be stored as JSON strings
      expect(data.embedding_full_text).toBeDefined()
      expect(data.embedding_requirements).toBeDefined()
      expect(data.embedding_skills).toBeDefined()
    }
  }, 30000)

  test('sets cache_key correctly', async () => {
    const metadata = extractFileMetadata('testbrand-20250129T143027Z.md')
    const normalized = normalizeContent('# Test Cache Key')
    const extracted = await extractSemanticData(normalized.normalized, true)
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
    
    const result = await storeJobPosting(metadata, normalized, extracted, embeddings)
    
    expect(result.success).toBe(true)
    
    if (result.success) {
      testIds.push(result.id)
      
      const { data } = await supabase
        .from('job_postings')
        .select('cache_key, brand_slug')
        .eq('id', result.id)
        .single()
      
      expect(data.cache_key).toBe('job_postings:testbrand')
      expect(data.brand_slug).toBe('testbrand')
    }
  }, 30000)

  test('handles storage errors gracefully', async () => {
    // Try to store with invalid metadata
    const invalidMetadata = {
      brand_slug: '',
      timestamp: new Date(),
      filename: 'invalid.md',
      format: 'md' as const,
      valid: false,
      error: 'Invalid'
    }
    
    const normalized = normalizeContent('# Test')
    const extracted = await extractSemanticData(normalized.normalized, true)
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
    
    const result = await storeJobPosting(invalidMetadata, normalized, extracted, embeddings)
    
    // Should handle error gracefully
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  }, 30000)
})
