// Integration tests for Job Posting File Watcher - Step 1
// Tests file detection functionality

import { promises as fs } from 'fs'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'

describe('File Watcher - Step 1: Detection', () => {
  const testDir = path.join(process.cwd(), 'data/job_postings/test')
  let watcherProcess: ChildProcess | null = null
  let logs: string[] = []

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true })
    
    // Start watcher process
    watcherProcess = spawn('tsx', ['scripts/job_posting_watcher.ts'], {
      cwd: process.cwd(),
      env: { ...process.env }
    })
    
    // Capture stdout
    watcherProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      logs.push(output)
      console.log('[test]', output.trim())
    })
    
    // Capture stderr
    watcherProcess.stderr?.on('data', (data) => {
      console.error('[test:error]', data.toString().trim())
    })
    
    // Wait for watcher to start
    await new Promise(resolve => setTimeout(resolve, 2000))
  })

  afterAll(async () => {
    // Kill watcher process
    if (watcherProcess) {
      watcherProcess.kill('SIGTERM')
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      console.warn('[test] Cleanup warning:', error)
    }
  })

  beforeEach(() => {
    // Clear logs before each test
    logs = []
  })

  test('detects new .md file', async () => {
    const testFile = path.join(testDir, 'test-20250129T143022Z.md')
    
    // Create file
    await fs.writeFile(testFile, '# Test Job Posting\n\nThis is a test.')
    
    // Wait for watcher to detect
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Verify detection
    const allLogs = logs.join('\n')
    expect(allLogs).toContain('Detected new file')
    expect(allLogs).toContain('test-20250129T143022Z.md')
    
    // Cleanup
    await fs.unlink(testFile)
  }, 10000)

  test('detects new .txt file', async () => {
    const testFile = path.join(testDir, 'test-20250129T143023Z.txt')
    
    await fs.writeFile(testFile, 'Plain text job posting')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const allLogs = logs.join('\n')
    expect(allLogs).toContain('Detected new file')
    expect(allLogs).toContain('test-20250129T143023Z.txt')
    
    await fs.unlink(testFile)
  }, 10000)

  test('detects new .json file', async () => {
    const testFile = path.join(testDir, 'test-20250129T143024Z.json')
    
    await fs.writeFile(testFile, JSON.stringify({ role: 'Test' }))
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const allLogs = logs.join('\n')
    expect(allLogs).toContain('Detected new file')
    expect(allLogs).toContain('test-20250129T143024Z.json')
    
    await fs.unlink(testFile)
  }, 10000)

  test('ignores non-supported file types', async () => {
    const testFile = path.join(testDir, 'test.pdf')
    
    await fs.writeFile(testFile, 'dummy pdf content')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const allLogs = logs.join('\n')
    expect(allLogs).not.toContain('test.pdf')
    
    await fs.unlink(testFile)
  }, 10000)

  test('handles subdirectories', async () => {
    const subDir = path.join(testDir, 'tmobile')
    await fs.mkdir(subDir, { recursive: true })
    
    const testFile = path.join(subDir, 'tmobile-20250129T143025Z.md')
    await fs.writeFile(testFile, '# T-Mobile Job Posting')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const allLogs = logs.join('\n')
    expect(allLogs).toContain('Detected new file')
    expect(allLogs).toContain('tmobile-20250129T143025Z.md')
    
    await fs.rm(subDir, { recursive: true, force: true })
  }, 10000)
})
