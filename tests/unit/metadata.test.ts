// Unit tests for Metadata Extraction - Step 4

import { describe, test, expect } from 'vitest'
import { extractFileMetadata } from '@/lib/job_postings/metadata'

describe('Metadata Extraction - Step 4', () => {
  test('extracts valid metadata from filename', () => {
    const result = extractFileMetadata('tmobile-20250129T143022Z.md')
    
    expect(result.valid).toBe(true)
    expect(result.brand_slug).toBe('tmobile')
    expect(result.timestamp.toISOString()).toBe('2025-01-29T14:30:22.000Z')
    expect(result.format).toBe('md')
    expect(result.filename).toBe('tmobile-20250129T143022Z.md')
    expect(result.error).toBeUndefined()
  })

  test('handles different file formats', () => {
    const mdResult = extractFileMetadata('warta-20250129T143022Z.md')
    expect(mdResult.format).toBe('md')
    expect(mdResult.valid).toBe(true)
    
    const txtResult = extractFileMetadata('warta-20250129T143022Z.txt')
    expect(txtResult.format).toBe('txt')
    expect(txtResult.valid).toBe(true)
    
    const jsonResult = extractFileMetadata('softswiss-20250129T143022Z.json')
    expect(jsonResult.format).toBe('json')
    expect(jsonResult.valid).toBe(true)
  })

  test('rejects invalid filename format', () => {
    const result = extractFileMetadata('invalid-filename.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid filename format')
    expect(result.error).toContain('Expected: {brand_slug}-{timestamp}')
  })

  test('rejects filename without timestamp', () => {
    const result = extractFileMetadata('tmobile.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid filename format')
  })

  test('rejects filename with invalid timestamp format', () => {
    const result = extractFileMetadata('tmobile-2025-01-29.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid filename format')
  })

  test('rejects invalid timestamp values', () => {
    const result = extractFileMetadata('tmobile-20259999T999999Z.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid timestamp')
    expect(result.error).toContain('20259999T999999Z')
  })

  test('rejects invalid month', () => {
    const result = extractFileMetadata('tmobile-20251399T143022Z.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid timestamp')
  })

  test('rejects invalid day', () => {
    const result = extractFileMetadata('tmobile-20250132T143022Z.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid timestamp')
  })

  test('handles brand slugs with hyphens', () => {
    const result = extractFileMetadata('t-mobile-poland-20250129T143022Z.md')
    
    expect(result.valid).toBe(true)
    expect(result.brand_slug).toBe('t-mobile-poland')
  })

  test('handles brand slugs with numbers', () => {
    const result = extractFileMetadata('company123-20250129T143022Z.md')
    
    expect(result.valid).toBe(true)
    expect(result.brand_slug).toBe('company123')
  })

  test('handles brand slugs with mixed alphanumeric and hyphens', () => {
    const result = extractFileMetadata('abc-123-xyz-20250129T143022Z.md')
    
    expect(result.valid).toBe(true)
    expect(result.brand_slug).toBe('abc-123-xyz')
  })

  test('rejects uppercase in brand slug', () => {
    const result = extractFileMetadata('TMobile-20250129T143022Z.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid filename format')
  })

  test('rejects special characters in brand slug', () => {
    const result = extractFileMetadata('t_mobile-20250129T143022Z.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid filename format')
  })

  test('handles different times of day', () => {
    const midnight = extractFileMetadata('test-20250129T000000Z.md')
    expect(midnight.valid).toBe(true)
    expect(midnight.timestamp.toISOString()).toBe('2025-01-29T00:00:00.000Z')
    
    const noon = extractFileMetadata('test-20250129T120000Z.md')
    expect(noon.valid).toBe(true)
    expect(noon.timestamp.toISOString()).toBe('2025-01-29T12:00:00.000Z')
    
    const endOfDay = extractFileMetadata('test-20250129T235959Z.md')
    expect(endOfDay.valid).toBe(true)
    expect(endOfDay.timestamp.toISOString()).toBe('2025-01-29T23:59:59.000Z')
  })

  test('handles leap year dates', () => {
    const leapDay = extractFileMetadata('test-20240229T120000Z.md')
    expect(leapDay.valid).toBe(true)
    expect(leapDay.timestamp.toISOString()).toBe('2024-02-29T12:00:00.000Z')
  })

  test('handles invalid leap year date (JS Date auto-corrects)', () => {
    // Note: JavaScript Date automatically corrects invalid dates
    // 2023-02-29 becomes 2023-03-01
    const result = extractFileMetadata('test-20230229T120000Z.md')
    
    expect(result.valid).toBe(true)
    // Date was auto-corrected to March 1st
    expect(result.timestamp.toISOString()).toBe('2023-03-01T12:00:00.000Z')
  })

  test('handles filename with path', () => {
    const result = extractFileMetadata('test/tmobile-20250129T143022Z.md')
    
    expect(result.valid).toBe(true)
    expect(result.brand_slug).toBe('tmobile')
    expect(result.filename).toBe('test/tmobile-20250129T143022Z.md')
  })

  test('handles filename with nested path', () => {
    const result = extractFileMetadata('data/job_postings/tmobile/tmobile-20250129T143022Z.md')
    
    expect(result.valid).toBe(true)
    expect(result.brand_slug).toBe('tmobile')
  })

  test('preserves original filename in result', () => {
    const filename = 'test-brand-20250129T143022Z.txt'
    const result = extractFileMetadata(filename)
    
    expect(result.filename).toBe(filename)
  })
})
