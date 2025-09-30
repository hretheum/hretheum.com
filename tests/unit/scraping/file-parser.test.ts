import { describe, it, expect } from 'vitest'
import { validateFile, parseJobPostingFile } from '@/lib/scraping/file-parser'

describe('File Parser', () => {
  describe('File Validation', () => {
    it('should accept valid file sizes', () => {
      const validSizes = [
        100, // 100 bytes
        1024, // 1 KB
        1024 * 1024, // 1 MB
        5 * 1024 * 1024 - 1, // Just under 5 MB
      ]
      
      validSizes.forEach(size => {
        const result = validateFile(size, 'md')
        expect(result.valid).toBe(true)
      })
    })
    
    it('should reject files exceeding 5MB limit', () => {
      const size = 5 * 1024 * 1024 + 1 // Just over 5MB
      const result = validateFile(size, 'md')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
      expect(result.error).toContain('5MB')
    })
    
    it('should reject empty files', () => {
      const result = validateFile(0, 'md')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })
    
    it('should accept supported file types', () => {
      const supportedTypes = ['md', 'txt', 'pdf', 'docx']
      
      supportedTypes.forEach(type => {
        const result = validateFile(1024, type)
        expect(result.valid).toBe(true)
      })
    })
    
    it('should reject unsupported file types', () => {
      const unsupportedTypes = ['exe', 'sh', 'bat', 'zip', 'jpg']
      
      unsupportedTypes.forEach(type => {
        const result = validateFile(1024, type)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Unsupported file type')
      })
    })
  })
  
  describe('Text File Parsing', () => {
    it('should parse markdown files', async () => {
      const content = '# Job Posting\n\n'.repeat(10) + 'Requirements: 5+ years experience' // > 100 chars
      const base64 = Buffer.from(content).toString('base64')
      
      const result = await parseJobPostingFile(base64, 'job.md', 'md')
      
      expect(result.length).toBeGreaterThan(100)
      expect(result).toContain('Requirements')
    })
    
    it('should parse text files', async () => {
      const content = 'Job Title: Senior Developer\n\n'.repeat(5) + 'Description: ' + 'X'.repeat(100)
      const base64 = Buffer.from(content).toString('base64')
      
      const result = await parseJobPostingFile(base64, 'job.txt', 'txt')
      
      expect(result.length).toBeGreaterThan(100)
      expect(result).toContain('Senior Developer')
    })
    
    it('should normalize whitespace in text files', async () => {
      const content = '  Multiple   spaces\n\n\n\nand    newlines  '.repeat(20)
      const base64 = Buffer.from(content).toString('base64')
      
      const result = await parseJobPostingFile(base64, 'job.txt', 'txt')
      
      // Should not have triple newlines or multiple spaces
      expect(result).not.toMatch(/\s{3,}/)
      expect(result).not.toMatch(/\n{3,}/)
    })
  })
  
  describe('Error Handling', () => {
    it('should reject invalid base64 encoding', async () => {
      await expect(
        parseJobPostingFile('not-valid-base64!!!', 'job.md', 'md')
      ).rejects.toThrow('Invalid base64')
    })
    
    it('should reject content that is too short', async () => {
      const shortContent = 'Too short'
      const base64 = Buffer.from(shortContent).toString('base64')
      
      await expect(
        parseJobPostingFile(base64, 'job.md', 'md')
      ).rejects.toThrow('too short')
    })
    
    it('should handle empty file content', async () => {
      const base64 = Buffer.from('').toString('base64')
      
      await expect(
        parseJobPostingFile(base64, 'job.md', 'md')
      ).rejects.toThrow('empty')
    })
  })
  
  describe('PDF Parsing', () => {
    it('should throw not implemented error for PDF files', async () => {
      const buffer = Buffer.from('fake pdf content')
      const base64 = buffer.toString('base64')
      
      await expect(
        parseJobPostingFile(base64, 'job.pdf', 'pdf')
      ).rejects.toThrow('not yet implemented')
    })
  })
  
  describe('DOCX Parsing', () => {
    it('should throw not implemented error for DOCX files', async () => {
      const buffer = Buffer.from('fake docx content')
      const base64 = buffer.toString('base64')
      
      await expect(
        parseJobPostingFile(base64, 'job.docx', 'docx')
      ).rejects.toThrow('not yet implemented')
    })
  })
})
