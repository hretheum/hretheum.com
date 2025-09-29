// Job Posting File Watcher - Step 1: Detection Only
// Detects new .md/.txt/.json files in data/job_postings/ and logs them

import { watch } from 'fs/promises'
import path from 'path'

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
          // TODO: Step 2 - Read file content
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
