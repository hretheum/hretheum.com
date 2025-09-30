import { describe, it, expect } from 'vitest'
import {
  validateCampaignSlug,
  generateAccentColor,
  generateDefaultHeadline,
  generateDefaultCTAs,
  generateDefaultSections,
  generateCampaignMDX,
  type CampaignTemplate,
} from '@/lib/campaigns/generator'

describe('Campaign Generator', () => {
  describe('Slug Validation', () => {
    it('should accept valid slugs', () => {
      const validSlugs = [
        'tmobile-g2m-lead',
        'backend-developer',
        'senior_designer',
        'my-campaign-2024',
        'ab',
      ]
      
      validSlugs.forEach(slug => {
        const result = validateCampaignSlug(slug)
        expect(result.valid).toBe(true)
      })
    })
    
    it('should reject slugs that are too short', () => {
      const result = validateCampaignSlug('a')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too short')
    })
    
    it('should reject slugs that are too long', () => {
      const slug = 'a'.repeat(101)
      const result = validateCampaignSlug(slug)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too long')
    })
    
    it('should reject slugs with uppercase letters', () => {
      const result = validateCampaignSlug('MySlug')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('lowercase')
    })
    
    it('should reject slugs with special characters', () => {
      const invalidSlugs = ['my@slug', 'slug!', 'slug space', 'slug.com']
      
      invalidSlugs.forEach(slug => {
        const result = validateCampaignSlug(slug)
        expect(result.valid).toBe(false)
      })
    })
  })
  
  describe('Accent Color Generation', () => {
    it('should return industry-specific colors', () => {
      expect(generateAccentColor('Fintech')).toBe('#10b981')
      expect(generateAccentColor('Telecom')).toBe('#e20074')
      expect(generateAccentColor('SaaS')).toBe('#8b5cf6')
    })
    
    it('should return default color for unknown industry', () => {
      const color = generateAccentColor('UnknownIndustry')
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
    
    it('should return valid hex colors', () => {
      const industries = ['Fintech', 'InsurTech', 'Telecom', 'SaaS']
      
      industries.forEach(industry => {
        const color = generateAccentColor(industry)
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })
  
  describe('Headline Generation', () => {
    it('should generate headline with role', () => {
      const headline = generateDefaultHeadline('Telecom', 'Senior Designer')
      expect(headline).toContain('TELECOM')
      expect(headline).toContain('SENIOR DESIGNER')
    })
    
    it('should generate headline without role', () => {
      const headline = generateDefaultHeadline('Fintech')
      expect(headline).toContain('FINTECH')
      expect(headline).toContain('HIRING SIGNALS')
    })
  })
  
  describe('Default CTAs', () => {
    it('should generate two CTAs', () => {
      const ctas = generateDefaultCTAs()
      expect(ctas).toHaveLength(2)
    })
    
    it('should have primary and secondary variants', () => {
      const ctas = generateDefaultCTAs()
      expect(ctas[0].variant).toBe('primary')
      expect(ctas[1].variant).toBe('secondary')
    })
    
    it('should include href for secondary CTA', () => {
      const ctas = generateDefaultCTAs()
      expect(ctas[1].href).toBeDefined()
      expect(ctas[1].href).toContain('https://')
    })
  })
  
  describe('Default Sections', () => {
    it('should generate 5 sections', () => {
      const sections = generateDefaultSections()
      expect(sections).toHaveLength(5)
    })
    
    it('should include standard section types', () => {
      const sections = generateDefaultSections()
      const types = sections.map(s => s.type)
      
      expect(types).toContain('meta')
      expect(types).toContain('metrics')
      expect(types).toContain('playbook')
      expect(types).toContain('closing_cta')
    })
  })
  
  describe('MDX Generation', () => {
    it('should generate valid MDX with minimal template', async () => {
      const template: CampaignTemplate = {
        slug: 'test-campaign',
        brand: 'testbrand',
        industry: 'Telecom',
      }
      
      const mdx = await generateCampaignMDX(template)
      
      expect(mdx).toContain('---')
      expect(mdx).toContain('slug: test-campaign')
      expect(mdx).toContain('brand: testbrand')
      expect(mdx).toContain('industry: Telecom')
    })
    
    it('should include all optional fields when provided', async () => {
      const template: CampaignTemplate = {
        slug: 'full-campaign',
        brand: 'tmobile',
        industry: 'Telecom',
        accent: '#e20074',
        ctaVariant: 'filled',
        role: 'Senior Designer',
        location: 'Warsaw',
        contract: 'B2B',
        period: '2025-01-01 – 2025-12-31',
        heroHeadline: 'Custom Headline',
      }
      
      const mdx = await generateCampaignMDX(template)
      
      // YAML may use single or double quotes
      expect(mdx).toMatch(/accent: ['"]#e20074['"]/)
      expect(mdx).toContain('role: Senior Designer')
      expect(mdx).toContain('location: Warsaw')
      expect(mdx).toContain('contract: B2B')
      expect(mdx).toContain('hero_headline: Custom Headline')
    })
    
    it('should generate default accent color if not provided', async () => {
      const template: CampaignTemplate = {
        slug: 'test',
        brand: 'test',
        industry: 'Telecom',
      }
      
      const mdx = await generateCampaignMDX(template)
      
      // YAML may use single or double quotes
      expect(mdx).toMatch(/accent: ['"]#e20074['"]/) // Telecom default
    })
    
    it('should reject invalid slug', async () => {
      const template: CampaignTemplate = {
        slug: 'Invalid Slug!',
        brand: 'test',
        industry: 'Telecom',
      }
      
      await expect(generateCampaignMDX(template)).rejects.toThrow('Invalid campaign slug')
    })
    
    it('should reject invalid accent color', async () => {
      const template: CampaignTemplate = {
        slug: 'test',
        brand: 'test',
        industry: 'Telecom',
        accent: 'red',
      }
      
      await expect(generateCampaignMDX(template)).rejects.toThrow('Invalid accent color')
    })
    
    it('should include metrics in frontmatter if provided', async () => {
      const template: CampaignTemplate = {
        slug: 'test',
        brand: 'test',
        industry: 'Telecom',
        metrics: [
          { label: 'Teams', value: '15+' },
          { label: 'Markets', value: '10+', note: 'EMEA' },
        ],
      }
      
      const mdx = await generateCampaignMDX(template)
      
      expect(mdx).toContain('metrics:')
      expect(mdx).toContain('label: Teams')
      expect(mdx).toContain('value: 15+')
    })
    
    it('should generate valid YAML frontmatter', async () => {
      const template: CampaignTemplate = {
        slug: 'test',
        brand: 'test',
        industry: 'Telecom',
      }
      
      const mdx = await generateCampaignMDX(template)
      
      // Should have YAML frontmatter delimiters
      expect(mdx).toMatch(/^---\n/)
      expect(mdx).toMatch(/\n---\n\n/)
    })
    
    it('should generate MDX body with components', async () => {
      const template: CampaignTemplate = {
        slug: 'test',
        brand: 'test',
        industry: 'Telecom',
        role: 'Designer',
      }
      
      const mdx = await generateCampaignMDX(template)
      
      expect(mdx).toContain('<SectionTitle')
      expect(mdx).toContain('<OutcomeBanner')
    })
  })
})
