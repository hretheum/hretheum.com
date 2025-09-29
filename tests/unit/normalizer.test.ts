// Unit tests for Content Normalizer - Step 3

import { describe, test, expect } from 'vitest'
import { normalizeContent } from '@/lib/job_postings/normalizer'

describe('Content Normalizer - Step 3', () => {
  test('removes HTML entities', () => {
    const input = 'Test&nbsp;with&amp;entities'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Test with&entities')
  })

  test('removes all common HTML entities', () => {
    const input = '&lt;div&gt;&quot;Hello&quot;&#39;World&#39;&amp;'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('<div>"Hello"\'World\'&')
  })

  test('normalizes line breaks from Windows to Unix', () => {
    const input = 'Line 1\r\nLine 2\r\nLine 3'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Line 1\nLine 2\nLine 3')
    expect(result.lineBreaks).toBe('windows')
  })

  test('detects mixed line breaks', () => {
    const input = 'Line 1\r\nLine 2\nLine 3'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Line 1\nLine 2\nLine 3')
    expect(result.lineBreaks).toBe('mixed')
  })

  test('detects Unix line breaks', () => {
    const input = 'Line 1\nLine 2\nLine 3'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Line 1\nLine 2\nLine 3')
    expect(result.lineBreaks).toBe('unix')
  })

  test('removes excessive whitespace', () => {
    const input = 'Too    many   spaces\n\n\n\nToo many newlines'
    const result = normalizeContent(input)
    
    // After removing leading/trailing whitespace per line, empty lines disappear
    expect(result.normalized).toBe('Too many spaces\nToo many newlines')
    expect(result.stats.whitespaceReduced).toBeGreaterThan(0)
  })

  test('removes multiple tabs', () => {
    const input = 'Tab\t\t\tseparated\t\tvalues'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Tab separated values')
  })

  test('removes leading whitespace per line', () => {
    const input = '  Line 1\n    Line 2\n      Line 3'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Line 1\nLine 2\nLine 3')
  })

  test('removes trailing whitespace per line', () => {
    const input = 'Line 1  \nLine 2    \nLine 3      '
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Line 1\nLine 2\nLine 3')
  })

  test('preserves UTF-8 characters', () => {
    const input = 'Zażółć gęślą jaźń'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Zażółć gęślą jaźń')
  })

  test('preserves UTF-8 characters with normalization', () => {
    const input = '  Zażółć   gęślą  \n\n\n  jaźń  '
    const result = normalizeContent(input)
    
    // After removing leading/trailing whitespace per line, empty lines disappear
    expect(result.normalized).toBe('Zażółć gęślą\njaźń')
    expect(result.normalized).toContain('ą')
    expect(result.normalized).toContain('ź')
  })

  test('removes non-printable characters', () => {
    const input = 'Test\x00with\x01control\x02chars'
    const result = normalizeContent(input)
    
    expect(result.normalized).not.toContain('\x00')
    expect(result.normalized).not.toContain('\x01')
    expect(result.normalized).not.toContain('\x02')
    expect(result.normalized).toBe('Testwithcontrolchars')
  })

  test('preserves newlines and tabs (printable whitespace)', () => {
    const input = 'Line 1\nLine 2\tTabbed'
    const result = normalizeContent(input)
    
    // After normalization, multiple tabs become single space
    expect(result.normalized).toContain('\n')
    expect(result.normalized).toBe('Line 1\nLine 2 Tabbed')
  })

  test('trims overall content', () => {
    const input = '   \n\n  Content here  \n\n   '
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Content here')
    expect(result.normalized[0]).not.toBe(' ')
    expect(result.normalized[result.normalized.length - 1]).not.toBe(' ')
  })

  test('tracks statistics correctly', () => {
    const input = 'Test    content\n\n\n\nwith   spaces'
    const result = normalizeContent(input)
    
    expect(result.stats.originalLength).toBe(input.length)
    expect(result.stats.normalizedLength).toBe(result.normalized.length)
    expect(result.stats.originalLength).toBeGreaterThan(result.stats.normalizedLength)
    expect(result.stats.whitespaceReduced).toBeGreaterThan(0)
    expect(result.stats.linesRemoved).toBeGreaterThan(0)
  })

  test('handles empty string', () => {
    const input = ''
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('')
    expect(result.stats.originalLength).toBe(0)
    expect(result.stats.normalizedLength).toBe(0)
  })

  test('handles string with only whitespace', () => {
    const input = '   \n\n\n   \t\t\t   '
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('')
    expect(result.stats.normalizedLength).toBe(0)
  })

  test('handles real job posting content', () => {
    const input = `# Senior Product Designer

## Requirements
- 5+ years    experience
- Strong   portfolio


## Responsibilities  
- Design   systems  
- Stakeholder   management  


`
    const result = normalizeContent(input)
    
    expect(result.normalized).toContain('# Senior Product Designer')
    expect(result.normalized).toContain('5+ years experience')
    expect(result.normalized).not.toContain('    ')
    expect(result.stats.whitespaceReduced).toBeGreaterThan(0)
  })

  test('preserves original content', () => {
    const input = 'Original   content\n\n\nwith   issues'
    const result = normalizeContent(input)
    
    expect(result.original).toBe(input)
    expect(result.original).not.toBe(result.normalized)
  })

  test('sets encoding to utf-8', () => {
    const input = 'Test content'
    const result = normalizeContent(input)
    
    expect(result.encoding).toBe('utf-8')
  })
})
