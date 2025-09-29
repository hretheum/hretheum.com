// Job Posting File Watcher - Steps 1-6
// Detects, reads, normalizes, extracts metadata, performs semantic extraction, and generates embeddings

import { watch } from 'fs/promises'
import path from 'path'
import { readJobPostingFile } from '../lib/job_postings/file_reader'
import { normalizeContent } from '../lib/job_postings/normalizer'
import { extractFileMetadata } from '../lib/job_postings/metadata'
import { extractSemanticData } from '../lib/job_postings/extractor'
import { generateEmbeddings } from '../lib/job_postings/embeddings'

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
          
          // Step 4: Extract metadata from filename
          const metadata = extractFileMetadata(event.filename)
          
          if (!metadata.valid) {
            console.error(`[watcher] Invalid filename: ${metadata.error}`)
            return
          }
          
          console.log(`[watcher] Processing job posting for brand: ${metadata.brand_slug}`)
          console.log(`[watcher] Timestamp: ${metadata.timestamp.toISOString()}`)
          
          // Step 2: Read file content
          try {
            const content = await readJobPostingFile(filePath)
            console.log(`[watcher] Content preview: ${content.slice(0, 100)}...`)
            
            // Step 3: Normalize content
            const normalized = normalizeContent(content)
            console.log(`[watcher] Normalized content (${normalized.stats.normalizedLength} chars)`)
            console.log(`[watcher] Line breaks: ${normalized.lineBreaks}`)
            
            // Step 5b: Extract semantic data (real LLM)
            const extracted = await extractSemanticData(normalized.normalized, false)
            console.log(`[watcher] Extracted ${extracted.technical_skills.length} technical skills`)
            console.log(`[watcher] Seniority: ${extracted.seniority_level}, Role: ${extracted.role_type}`)
            
            // Step 6: Generate embeddings (mock)
            const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
            console.log(`[watcher] Generated embeddings (${embeddings.dimensions}D)`)
            // TODO: Step 7 - Store in database
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
