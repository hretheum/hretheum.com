import { describe, it, expect } from 'vitest'
import { CreateCampaignRequestSchema, CampaignSourceSchema } from '@/lib/campaigns/types'

describe('Campaign Request Validation', () => {
  describe('URL Source Validation', () => {
    it('should accept valid URL source', () => {
      const data = {
        source: {
          type: 'url',
          url: 'https://pracuj.pl/job/12345',
        },
        brandSlug: 'tmobile',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
    
    it('should reject invalid URL format', () => {
      const data = {
        source: {
          type: 'url',
          url: 'not-a-url',
        },
        brandSlug: 'tmobile',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid URL')
      }
    })
  })
  
  describe('Text Source Validation', () => {
    it('should accept valid text source', () => {
      const data = {
        source: {
          type: 'text',
          content: 'A'.repeat(150), // Valid length
        },
        brandSlug: 'tmobile',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
    
    it('should reject text too short', () => {
      const data = {
        source: {
          type: 'text',
          content: 'Too short',
        },
        brandSlug: 'tmobile',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 100 characters')
      }
    })
    
    it('should reject text too long', () => {
      const data = {
        source: {
          type: 'text',
          content: 'A'.repeat(50001),
        },
        brandSlug: 'tmobile',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('too long')
      }
    })
  })
  
  describe('File Source Validation', () => {
    it('should accept valid file source', () => {
      const data = {
        source: {
          type: 'file',
          fileData: 'base64encodeddata',
          fileName: 'job-posting.md',
          fileType: 'md',
        },
        brandSlug: 'tmobile',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
    
    it('should reject unsupported file type', () => {
      const data = {
        source: {
          type: 'file',
          fileData: 'base64encodeddata',
          fileName: 'job-posting.exe',
          fileType: 'exe',
        },
        brandSlug: 'tmobile',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Unsupported file type')
      }
    })
  })
  
  describe('Brand Slug Validation', () => {
    it('should accept valid brand slug', () => {
      const data = {
        source: { type: 'url', url: 'https://example.com' },
        brandSlug: 'my-brand-123',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
    
    it('should reject uppercase in brand slug', () => {
      const data = {
        source: { type: 'url', url: 'https://example.com' },
        brandSlug: 'MyBrand',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('lowercase')
      }
    })
    
    it('should reject special characters in brand slug', () => {
      const data = {
        source: { type: 'url', url: 'https://example.com' },
        brandSlug: 'brand@123',
        industry: 'Telecom',
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
  
  describe('Accent Color Validation', () => {
    it('should accept valid hex color', () => {
      const data = {
        source: { type: 'url', url: 'https://example.com' },
        brandSlug: 'tmobile',
        industry: 'Telecom',
        metadata: {
          accent: '#e20074',
        },
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
    
    it('should reject invalid hex color format', () => {
      const data = {
        source: { type: 'url', url: 'https://example.com' },
        brandSlug: 'tmobile',
        industry: 'Telecom',
        metadata: {
          accent: 'red',
        },
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid hex color')
      }
    })
  })
  
  describe('Complete Request Validation', () => {
    it('should accept complete valid request with all optional fields', () => {
      const data = {
        source: {
          type: 'url',
          url: 'https://pracuj.pl/job/12345',
        },
        brandSlug: 'tmobile',
        industry: 'Telecom',
        campaignSlug: 'tmobile-g2m-lead',
        metadata: {
          role: 'Go2Market Lead',
          location: 'Warsaw',
          contract: 'B2B',
          period: '2025-01-01 – 2025-12-31',
          accent: '#e20074',
          ctaVariant: 'filled',
          heroHeadline: 'Join T-Mobile Poland',
        },
        advanced: {
          ctas: [
            { label: 'Spotkajmy się', variant: 'primary' },
            { label: 'AI Chat', href: 'https://hretheum.com', variant: 'secondary' },
          ],
          metrics: [
            { label: 'Teams', value: '15+' },
            { label: 'Markets', value: '10+', note: 'Across EMEA' },
          ],
          sections: [
            { type: 'meta' },
            { type: 'playbook' },
          ],
        },
      }
      
      const result = CreateCampaignRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})
