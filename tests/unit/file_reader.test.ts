// Unit tests for Job Posting File Reader - Step 2

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { readJobPostingFile } from '@/lib/job_postings/file_reader'

describe('File Reader - Step 2', () => {
  const testDir = path.join(process.cwd(), 'data/job_postings/test-unit')

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true })
  })

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      console.warn('[test] Cleanup warning:', error)
    }
  })

  test('reads markdown file correctly', async () => {
    const testFile = path.join(testDir, 'test.md')
    await fs.writeFile(testFile, '# Test\nContent here')

    const content = await readJobPostingFile(testFile)

    expect(content).toContain('# Test')
    expect(content).toContain('Content here')
    expect(content.length).toBeGreaterThan(0)
  })

  test('reads plain text file correctly', async () => {
    const testFile = path.join(testDir, 'test.txt')
    await fs.writeFile(testFile, 'Plain text content\nLine 2')

    const content = await readJobPostingFile(testFile)

    expect(content).toContain('Plain text content')
    expect(content).toContain('Line 2')
  })

  test('reads JSON file correctly', async () => {
    const testFile = path.join(testDir, 'test.json')
    const jsonContent = { role: 'Test Role', company: 'Test Company' }
    await fs.writeFile(testFile, JSON.stringify(jsonContent, null, 2))

    const content = await readJobPostingFile(testFile)

    expect(content).toContain('Test Role')
    expect(content).toContain('Test Company')
    expect(() => JSON.parse(content)).not.toThrow()
  })

  test('handles UTF-8 encoding correctly (Polish characters)', async () => {
    const testFile = path.join(testDir, 'test-utf8.md')
    const polishText = 'Zażółć gęślą jaźń\nĄĆĘŁŃÓŚŹŻ'
    await fs.writeFile(testFile, polishText, 'utf-8')

    const content = await readJobPostingFile(testFile)

    expect(content).toBe(polishText)
    expect(content).toContain('Zażółć')
    expect(content).toContain('ĄĆĘŁŃÓŚŹŻ')
  })

  test('handles empty file', async () => {
    const testFile = path.join(testDir, 'empty.md')
    await fs.writeFile(testFile, '')

    const content = await readJobPostingFile(testFile)

    expect(content).toBe('')
    expect(content.length).toBe(0)
  })

  test('handles large file', async () => {
    const testFile = path.join(testDir, 'large.md')
    const largeContent = '# Large File\n' + 'Lorem ipsum '.repeat(1000)
    await fs.writeFile(testFile, largeContent)

    const content = await readJobPostingFile(testFile)

    expect(content.length).toBeGreaterThan(10000)
    expect(content).toContain('# Large File')
  })

  test('throws error for non-existent file', async () => {
    await expect(
      readJobPostingFile('/non/existent/file.md')
    ).rejects.toThrow('Failed to read job posting file')
  })

  test('throws error for directory instead of file', async () => {
    await expect(
      readJobPostingFile(testDir)
    ).rejects.toThrow()
  })
})
