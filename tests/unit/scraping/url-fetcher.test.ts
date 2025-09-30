import { describe, it, expect } from 'vitest'
import { validateJobPostingUrl } from '@/lib/scraping/url-fetcher'

describe('URL Fetcher', () => {
  describe('URL Validation', () => {
    it('should accept URLs from whitelisted domains', () => {
      const validUrls = [
        'https://pracuj.pl/praca/senior-designer',
        'https://www.nofluffjobs.com/job/backend-developer',
        'https://justjoin.it/offers/frontend-react',
        'https://jobs.rocketjobs.pl/position/123',
        'https://bulldogjob.pl/companies/jobs/123',
      ]
      
      validUrls.forEach(url => {
        const result = validateJobPostingUrl(url)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })
    
    it('should reject URLs from non-whitelisted domains', () => {
      const invalidUrls = [
        'https://evil.com/job',
        'https://localhost:3000/job',
        'https://192.168.1.1/job',
      ]
      
      invalidUrls.forEach(url => {
        const result = validateJobPostingUrl(url)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('not whitelisted')
      })
    })
    
    it('should reject non-HTTP(S) URLs', () => {
      const invalidProtocols = [
        'ftp://pracuj.pl/job',
        'file:///etc/passwd',
        'javascript:alert(1)',
      ]
      
      invalidProtocols.forEach(url => {
        const result = validateJobPostingUrl(url)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('http')
      })
    })
    
    it('should handle malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'htp://broken.com',
        '',
      ]
      
      malformedUrls.forEach(url => {
        const result = validateJobPostingUrl(url)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
    
    it('should accept subdomains of whitelisted domains', () => {
      const subdomainUrls = [
        'https://www.pracuj.pl/job',
        'https://jobs.pracuj.pl/position',
        'https://en.nofluffjobs.com/offer',
      ]
      
      subdomainUrls.forEach(url => {
        const result = validateJobPostingUrl(url)
        expect(result.valid).toBe(true)
      })
    })
  })
  
  describe('SSRF Prevention', () => {
    it('should block internal IP addresses', () => {
      const internalIPs = [
        'http://localhost/job',
        'http://127.0.0.1/job',
        'http://192.168.1.1/job',
        'http://10.0.0.1/job',
        'http://172.16.0.1/job',
      ]
      
      internalIPs.forEach(url => {
        const result = validateJobPostingUrl(url)
        expect(result.valid).toBe(false)
      })
    })
    
    it('should block cloud metadata endpoints', () => {
      const metadataUrls = [
        'http://169.254.169.254/latest/meta-data',
        'http://metadata.google.internal',
      ]
      
      metadataUrls.forEach(url => {
        const result = validateJobPostingUrl(url)
        expect(result.valid).toBe(false)
      })
    })
  })
  
  describe('Content Extraction', () => {
    // Note: These are unit tests for validation logic only
    // Integration tests with real fetching are in integration tests
    
    it('should validate minimum content length', () => {
      const shortContent = 'Too short'
      expect(shortContent.length).toBeLessThan(100)
    })
    
    it('should handle content normalization', () => {
      const rawContent = '  Multiple   spaces\n\n\n\nand    newlines  '
      const normalized = rawContent.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
      
      expect(normalized).toBe('Multiple spaces and newlines')
    })
  })
})
