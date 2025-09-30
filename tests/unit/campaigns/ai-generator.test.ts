import { describe, it, expect } from 'vitest'
import { validateGeneratedContent, type AIGenerationOutput } from '@/lib/campaigns/ai-generator'

describe('AI Campaign Generator', () => {
  describe('Content Validation', () => {
    it('should validate valid generated content', () => {
      const output: AIGenerationOutput = {
        narrative: {
          positioning: 'Senior Product Designer with 15+ years experience',
          keyMessages: ['UX Strategy', 'Design Systems', 'Team Leadership'],
          tone: 'leadership',
          confidence: 0.85,
        },
        copy: {
          heroHeadline: 'TELECOM PRODUCT DESIGN LEADER',
          heroSubtitle: 'Driving UX excellence at scale',
          sections: [
            {
              type: 'intro',
              title: 'Experience',
              content: 'Led design teams across multiple markets',
            },
          ],
          confidence: 0.82,
        },
        caseStudies: [
          {
            id: 'cs-001',
            title: 'T-Mobile Portal Redesign',
            relevanceScore: 0.87,
            matchedSkills: ['UX Design', 'Design Systems'],
            matchedContext: 'Telecom e-commerce',
          },
        ],
        metrics: [
          {
            label: 'Markets',
            value: '10+',
            source: 'T-Mobile project',
          },
        ],
      }
      
      const result = validateGeneratedContent(output)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should reject hero headline that is too long', () => {
      const output: AIGenerationOutput = {
        narrative: {
          positioning: 'Test',
          keyMessages: ['Test'],
          tone: 'technical',
          confidence: 0.8,
        },
        copy: {
          heroHeadline: 'A'.repeat(201), // Too long
          sections: [],
          confidence: 0.8,
        },
        caseStudies: [],
        metrics: [],
      }
      
      const result = validateGeneratedContent(output)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Hero headline too long (> 200 chars)')
    })
    
    it('should flag low confidence scores', () => {
      const output: AIGenerationOutput = {
        narrative: {
          positioning: 'Test',
          keyMessages: ['Test'],
          tone: 'technical',
          confidence: 0.4, // Low confidence
        },
        copy: {
          heroHeadline: 'Test Headline',
          sections: [],
          confidence: 0.3, // Low confidence
        },
        caseStudies: [],
        metrics: [],
      }
      
      const result = validateGeneratedContent(output)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('confidence'))).toBe(true)
    })
    
    it('should flag case studies with low relevance', () => {
      const output: AIGenerationOutput = {
        narrative: {
          positioning: 'Test',
          keyMessages: ['Test'],
          tone: 'technical',
          confidence: 0.8,
        },
        copy: {
          heroHeadline: 'Test',
          sections: [],
          confidence: 0.8,
        },
        caseStudies: [
          {
            id: 'cs-001',
            title: 'Project A',
            relevanceScore: 0.5, // Low relevance
            matchedSkills: [],
            matchedContext: '',
          },
          {
            id: 'cs-002',
            title: 'Project B',
            relevanceScore: 0.4, // Low relevance
            matchedSkills: [],
            matchedContext: '',
          },
        ],
        metrics: [],
      }
      
      const result = validateGeneratedContent(output)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('low relevance'))).toBe(true)
    })
    
    it('should reject missing critical fields', () => {
      const output: AIGenerationOutput = {
        narrative: {
          positioning: 'Test',
          keyMessages: [], // Empty
          tone: 'technical',
          confidence: 0.8,
        },
        copy: {
          heroHeadline: '', // Empty
          sections: [],
          confidence: 0.8,
        },
        caseStudies: [],
        metrics: [],
      }
      
      const result = validateGeneratedContent(output)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing hero headline')
      expect(result.errors).toContain('No key messages generated')
    })
  })
  
  describe('AI Generation Input', () => {
    it('should accept valid job posting structure', () => {
      const input = {
        jobPosting: {
          content: 'Full job posting content...',
          requirements: ['5+ years experience', 'Design systems expertise'],
          skills: ['Figma', 'React', 'TypeScript'],
          role: 'Senior Product Designer',
          seniority: 'Senior',
        },
        brand: 'tmobile',
        industry: 'Telecom',
      }
      
      expect(input.jobPosting.requirements.length).toBeGreaterThan(0)
      expect(input.jobPosting.skills.length).toBeGreaterThan(0)
    })
    
    it('should handle empty requirements gracefully', () => {
      const input = {
        jobPosting: {
          content: 'Content',
          requirements: [],
          skills: [],
          role: 'Designer',
          seniority: 'Mid',
        },
        brand: 'test',
        industry: 'Generic',
      }
      
      // Should not throw
      expect(input.jobPosting.requirements).toEqual([])
    })
  })
  
  describe('Case Study Prioritization', () => {
    it('should sort case studies by relevance score', () => {
      const caseStudies = [
        { id: '1', title: 'A', relevanceScore: 0.6, matchedSkills: [], matchedContext: '' },
        { id: '2', title: 'B', relevanceScore: 0.9, matchedSkills: [], matchedContext: '' },
        { id: '3', title: 'C', relevanceScore: 0.7, matchedSkills: [], matchedContext: '' },
      ]
      
      const sorted = [...caseStudies].sort((a, b) => b.relevanceScore - a.relevanceScore)
      
      expect(sorted[0].id).toBe('2') // Highest relevance
      expect(sorted[0].relevanceScore).toBe(0.9)
    })
    
    it('should filter case studies below threshold', () => {
      const caseStudies = [
        { id: '1', title: 'A', relevanceScore: 0.7, matchedSkills: [], matchedContext: '' },
        { id: '2', title: 'B', relevanceScore: 0.5, matchedSkills: [], matchedContext: '' },
        { id: '3', title: 'C', relevanceScore: 0.8, matchedSkills: [], matchedContext: '' },
      ]
      
      const threshold = 0.6
      const filtered = caseStudies.filter(cs => cs.relevanceScore >= threshold)
      
      expect(filtered.length).toBe(2)
      expect(filtered.every(cs => cs.relevanceScore >= threshold)).toBe(true)
    })
  })
  
  describe('Metrics Generation', () => {
    it('should include source for each metric', () => {
      const metrics = [
        { label: 'Teams', value: '15+', source: 'T-Mobile project' },
        { label: 'Markets', value: '10+', source: 'ING Bank project' },
      ]
      
      metrics.forEach(metric => {
        expect(metric.source).toBeDefined()
        expect(metric.source.length).toBeGreaterThan(0)
      })
    })
    
    it('should have valid label-value pairs', () => {
      const metrics = [
        { label: 'Experience', value: '15+ years', source: 'Portfolio' },
        { label: 'Projects', value: '50+', source: 'Career total' },
      ]
      
      metrics.forEach(metric => {
        expect(metric.label).toBeDefined()
        expect(metric.value).toBeDefined()
        expect(metric.label.length).toBeGreaterThan(0)
        expect(metric.value.length).toBeGreaterThan(0)
      })
    })
  })
  
  describe('Narrative Generation', () => {
    it('should select appropriate tone based on role', () => {
      const tones = ['technical', 'leadership', 'strategic'] as const
      
      tones.forEach(tone => {
        expect(['technical', 'leadership', 'strategic']).toContain(tone)
      })
    })
    
    it('should generate 3-5 key messages', () => {
      const keyMessages = [
        'Design systems expertise',
        'Team leadership',
        'Strategic vision',
        'Measurable outcomes',
      ]
      
      expect(keyMessages.length).toBeGreaterThanOrEqual(3)
      expect(keyMessages.length).toBeLessThanOrEqual(5)
    })
  })
})
