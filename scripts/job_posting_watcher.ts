// Job Posting File Watcher - Steps 1-3
// Detects, reads, and normalizes job posting files

import { watch } from 'fs/promises'
import path from 'path'
import { readJobPostingFile } from '../lib/job_postings/file_reader'
import { normalizeContent } from '../lib/job_postings/normalizer'

const JOB_POSTINGS_DIR = path.join(process.cwd(), 'data/job_postings')

async function startWatcher() {
  console.log(`[watcher] Starting job posting file watcher...`)
  console.log(`[watcher] Watching: ${JOB_POSTINGS_DIR}`)
  
  try {
    const watcher = watch(JOB_POSTINGS_DIR, { recursive: true })
    
    for await (const event of watcher) {
      if (event.eventType === 'rename' && event.filename) {
        const filePath = path.join(JOB_POSTINGS_DIR, event.filename)
        const ext = path.extname(event.filename)
        
        // Only process supported formats
        if (['.md', '.txt', '.json'].includes(ext)) {
          console.log(`[watcher] Detected new file: ${event.filename}`)
          console.log(`[watcher] Full path: ${filePath}`)
          console.log(`[watcher] Format: ${ext}`)
          
          // Step 2: Read file content
          try {
            const content = await readJobPostingFile(filePath)
            console.log(`[watcher] Content preview: ${content.slice(0, 100)}...`)
            
            // Step 3: Normalize content
            const normalized = normalizeContent(content)
            console.log(`[watcher] Normalized content (${normalized.stats.normalizedLength} chars)`)
            console.log(`[watcher] Line breaks: ${normalized.lineBreaks}`)
            // TODO: Step 4 - Extract metadata
          } catch (error: any) {
            console.error(`[watcher] Failed to process file: ${error.message}`)
          }
        }
      }
    }
  } catch (error) {
    console.error(`[watcher] Error:`, error)
    throw error
  }
}

// Start watcher
startWatcher().catch((error) => {
  console.error('[watcher] Fatal error:', error)
  process.exit(1)
})
