#!/usr/bin/env tsx
// Job Posting Ingestion Script (On-Demand)
// Manual trigger for processing individual job posting files
// Same pipeline as watcher: read, normalize, extract, embed, store, invalidate cache

import { config } from 'dotenv'
import path from 'path'
import { readJobPostingFile } from '../lib/job_postings/file_reader'
import { normalizeContent } from '../lib/job_postings/normalizer'
import { extractFileMetadata } from '../lib/job_postings/metadata'
import { extractSemanticData } from '../lib/job_postings/extractor'
import { generateEmbeddings } from '../lib/job_postings/embeddings'
import { storeJobPosting } from '../lib/job_postings/storage'
import { invalidateBrandCache } from '../lib/job_postings/cache'

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'

async function ingestJobPosting(filePath: string) {
  console.log(`${BLUE}🚀 Job Posting Ingestion Pipeline${RESET}`)
  console.log('='.repeat(60))
  console.log()
  
  try {
    // Validate file path
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath)
    
    const fileName = path.basename(filePath)
    const ext = path.extname(fileName)
    
    // Validate format
    if (!['.md', '.txt', '.json'].includes(ext)) {
      console.error(`${RED}❌ Unsupported format:${RESET} ${ext}`)
      console.error('   Supported formats: .md, .txt, .json')
      process.exit(1)
    }
    
    console.log(`📁 File: ${fileName}`)
    console.log(`📂 Path: ${absolutePath}`)
    console.log()
    
    // Step 1: Extract metadata from filename
    console.log(`${BLUE}[1/7]${RESET} Extracting metadata...`)
    const metadata = extractFileMetadata(fileName)
    
    if (!metadata.valid) {
      console.error(`${RED}❌ Invalid filename format:${RESET} ${metadata.error}`)
      console.error('   Expected format: <brand>-<timestamp>.md')
      console.error('   Example: tmobile-20250929T224212Z.md')
      process.exit(1)
    }
    
    console.log(`   ${GREEN}✓${RESET} Brand: ${metadata.brand_slug}`)
    console.log(`   ${GREEN}✓${RESET} Timestamp: ${metadata.timestamp.toISOString()}`)
    console.log()
    
    // Step 2: Read file content
    console.log(`${BLUE}[2/7]${RESET} Reading file...`)
    const content = await readJobPostingFile(absolutePath)
    console.log(`   ${GREEN}✓${RESET} Read ${content.length} characters`)
    console.log(`   Preview: ${content.slice(0, 100)}...`)
    console.log()
    
    // Step 3: Normalize content
    console.log(`${BLUE}[3/7]${RESET} Normalizing content...`)
    const normalized = normalizeContent(content)
    console.log(`   ${GREEN}✓${RESET} Original: ${normalized.stats.originalLength} chars`)
    console.log(`   ${GREEN}✓${RESET} Normalized: ${normalized.stats.normalizedLength} chars`)
    console.log(`   ${GREEN}✓${RESET} Removed ${normalized.stats.linesRemoved} empty lines`)
    console.log(`   ${GREEN}✓${RESET} Line breaks: ${normalized.lineBreaks}`)
    console.log()
    
    // Step 4: Extract semantic data with LLM
    console.log(`${BLUE}[4/7]${RESET} Extracting semantic data (LLM)...`)
    const extracted = await extractSemanticData(normalized.normalized)
    console.log(`   ${GREEN}✓${RESET} Technical skills: ${extracted.technical_skills.length}`)
    console.log(`   ${GREEN}✓${RESET} Soft skills: ${extracted.soft_skills.length}`)
    console.log(`   ${GREEN}✓${RESET} Core requirements: ${extracted.core_requirements.length}`)
    console.log(`   ${GREEN}✓${RESET} Responsibilities: ${extracted.responsibilities.length}`)
    console.log(`   ${GREEN}✓${RESET} Domain knowledge: ${extracted.domain_knowledge.length}`)
    console.log(`   ${GREEN}✓${RESET} Seniority: ${extracted.seniority_level}`)
    console.log(`   ${GREEN}✓${RESET} Role type: ${extracted.role_type}`)
    console.log()
    
    // Step 5: Generate embeddings with OpenAI
    console.log(`${BLUE}[5/7]${RESET} Generating embeddings (OpenAI)...`)
    const embeddings = await generateEmbeddings(normalized.normalized, extracted)
    console.log(`   ${GREEN}✓${RESET} Full text embedding: ${embeddings.full_text.length}D`)
    console.log(`   ${GREEN}✓${RESET} Requirements embedding: ${embeddings.requirements.length}D`)
    console.log(`   ${GREEN}✓${RESET} Skills embedding: ${embeddings.skills.length}D`)
    console.log(`   ${GREEN}✓${RESET} Model: ${embeddings.model}`)
    console.log()
    
    // Step 6: Store in database
    console.log(`${BLUE}[6/7]${RESET} Storing in Supabase...`)
    const stored = await storeJobPosting(metadata, normalized, extracted, embeddings)
    
    if (stored.success) {
      console.log(`   ${GREEN}✓${RESET} Stored successfully`)
      console.log(`   ${GREEN}✓${RESET} ID: ${stored.id}`)
    } else {
      if (stored.error?.includes('duplicate')) {
        console.log(`   ${YELLOW}⚠${RESET}  Already exists (duplicate content hash)`)
      } else {
        throw new Error(stored.error || 'Unknown storage error')
      }
    }
    console.log()
    
    // Step 7: Invalidate cache
    console.log(`${BLUE}[7/7]${RESET} Invalidating suggestion cache...`)
    await invalidateBrandCache(metadata.brand_slug)
    console.log(`   ${GREEN}✓${RESET} Cache invalidated for brand: ${metadata.brand_slug}`)
    console.log()
    
    // Success summary
    console.log('='.repeat(60))
    console.log(`${GREEN}✓ PIPELINE COMPLETE${RESET}`)
    console.log('='.repeat(60))
    console.log()
    console.log('Job posting successfully processed:')
    console.log(`  Brand: ${metadata.brand_slug}`)
    console.log(`  Title: Job Posting - ${metadata.brand_slug}`)
    console.log(`  Seniority: ${extracted.seniority_level}`)
    console.log(`  Skills: ${extracted.technical_skills.length} technical, ${extracted.soft_skills.length} soft`)
    console.log()
    console.log('Next steps:')
    console.log(`  1. Visit /brand/${metadata.brand_slug} to see suggestions`)
    console.log(`  2. Cache will refresh on next request`)
    console.log()
    
  } catch (error) {
    console.error()
    console.error(`${RED}❌ PIPELINE FAILED${RESET}`)
    console.error('='.repeat(60))
    console.error(error)
    console.error()
    process.exit(1)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`${BLUE}Job Posting Ingestion Script${RESET}`)
  console.log()
  console.log('Usage:')
  console.log('  npx tsx scripts/ingest-job-posting.ts <file-path>')
  console.log()
  console.log('Examples:')
  console.log('  npx tsx scripts/ingest-job-posting.ts data/job_postings/tmobile/tmobile-20250929T224212Z.md')
  console.log('  npx tsx scripts/ingest-job-posting.ts data/job_postings/webimpact/webimpact-20250130T120000Z.md')
  console.log()
  console.log('File naming convention:')
  console.log('  <brand>-<timestamp>.md')
  console.log('  Timestamp format: YYYYMMDDTHHmmssZ')
  console.log()
  process.exit(0)
}

const filePath = args[0]
ingestJobPosting(filePath)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
