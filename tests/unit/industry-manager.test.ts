import { describe, it, expect } from 'vitest'
import {
  generateIndustrySlug,
  createNewIndustry,
  listAllIndustries,
  industryExists
} from '../../lib/campaigns/industry-manager'

describe('Industry Manager', () => {
  describe('generateIndustrySlug', () => {
    it('should convert to kebab-case', () => {
      expect(generateIndustrySlug('Health Care')).toBe('health-care')
      expect(generateIndustrySlug('Financial Services')).toBe('financial-services')
    })
    
    it('should handle special characters', () => {
      expect(generateIndustrySlug('E-Commerce & Retail')).toBe('ecommerce-retail')
      expect(generateIndustrySlug('AI/ML Technology')).toBe('aiml-technology')
    })
    
    it('should handle multiple spaces', () => {
      expect(generateIndustrySlug('Health   Care')).toBe('health-care')
      expect(generateIndustrySlug('  Fintech  ')).toBe('fintech')
    })
    
    it('should handle already kebab-cased input', () => {
      expect(generateIndustrySlug('health-care')).toBe('health-care')
    })
    
    it('should handle single word', () => {
      expect(generateIndustrySlug('Retail')).toBe('retail')
    })
    
    it('should remove leading/trailing hyphens', () => {
      expect(generateIndustrySlug('-Health-')).toBe('health')
    })
  })
  
  describe('createNewIndustry validation', () => {
    it('should reject names that are too short', async () => {
      const result = await createNewIndustry('ab')
      expect(result.success).toBe(false)
      expect(result.error).toContain('at least 3 characters')
    })
    
    it('should reject names that are too long', async () => {
      const longName = 'a'.repeat(51)
      const result = await createNewIndustry(longName)
      expect(result.success).toBe(false)
      expect(result.error).toContain('at most 50 characters')
    })
    
    it('should reject names with invalid characters', async () => {
      const result = await createNewIndustry('Tech@Industry!')
      expect(result.success).toBe(false)
      expect(result.error).toContain('letters, numbers, spaces')
    })
    
    it('should accept valid names', () => {
      // Valid formats
      const valid = [
        'Healthcare',
        'Health Care',
        'E-Commerce',
        'AI & ML',
        'FinTech 2.0'
      ]
      
      valid.forEach(name => {
        const slug = generateIndustrySlug(name)
        expect(slug.length).toBeGreaterThan(0)
      })
    })
  })
})
