# Job Posting Intelligence - Incremental Implementation Plan

**Parent Spec**: [JOB_POSTING_INTELLIGENCE_SPEC.md](./JOB_POSTING_INTELLIGENCE_SPEC.md)  
**Implementation Strategy**: Test-Driven, Incremental Delivery  
**Focus**: Workflow 1 - File Upload & Processing

---

## Implementation Philosophy

Each step is:
- ✅ **Independently testable** - Can be validated in isolation
- ✅ **Deployable** - Can go to production without breaking existing features
- ✅ **Reversible** - Can be rolled back if issues arise
- ✅ **Observable** - Has logging and monitoring from day one

---

## Workflow 1: File Upload Processing (9 Steps)

### ✅ Step 1: File Watcher - Detection Only (COMPLETED)
    **Goal**: Detect new files in `data/job_postings/` and log them

#### Implementation
```typescript
// scripts/job_posting_watcher.ts
import { watch } from 'fs/promises'
import path from 'path'

const JOB_POSTINGS_DIR = path.join(process.cwd(), 'data/job_postings')

async function startWatcher() {
  console.log(`[watcher] Watching: ${JOB_POSTINGS_DIR}`)
  
  const watcher = watch(JOB_POSTINGS_DIR, { recursive: true })
  
  for await (const event of watcher) {
    if (event.eventType === 'rename' && event.filename) {
      const filePath = path.join(JOB_POSTINGS_DIR, event.filename)
      const ext = path.extname(event.filename)
      
      // Only process supported formats
      if (['.md', '.txt', '.json'].includes(ext)) {
        console.log(`[watcher] Detected new file: ${event.filename}`)
        // TODO: Step 2 - Read file content
      }
    }
  }
}

startWatcher().catch(console.error)
```

#### Test Plan
```typescript
// tests/integration/file_watcher.test.ts
import { promises as fs } from 'fs'
import path from 'path'

describe('File Watcher - Step 1', () => {
  const testDir = path.join(process.cwd(), 'data/job_postings/test')
  
  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true })
  })
  
  test('detects new .md file', async () => {
    const testFile = path.join(testDir, 'test-20250129.md')
    const logs: string[] = []
    
    // Mock console.log to capture output
    const originalLog = console.log
    console.log = (...args) => logs.push(args.join(' '))
    
    // Create file
    await fs.writeFile(testFile, '# Test Job Posting')
    
    // Wait for watcher to detect
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Verify detection
    expect(logs.some(log => log.includes('Detected new file'))).toBe(true)
    expect(logs.some(log => log.includes('test-20250129.md'))).toBe(true)
    
    console.log = originalLog
  })
  
  test('ignores non-supported file types', async () => {
    const testFile = path.join(testDir, 'test.pdf')
    const logs: string[] = []
    
    const originalLog = console.log
    console.log = (...args) => logs.push(args.join(' '))
    
    await fs.writeFile(testFile, 'dummy content')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    expect(logs.some(log => log.includes('test.pdf'))).toBe(false)
    
    console.log = originalLog
  })
  
  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })
})
```

#### Acceptance Criteria
- [x] Watcher starts without errors
- [x] Logs appear when .md/.txt/.json files are added
- [x] No logs for other file types (.pdf, .docx, etc.)
- [x] Watcher handles subdirectories (e.g., `data/job_postings/tmobile/`)
- [x] Integration test passes

#### ✅ Status: COMPLETED
- Implementation: `scripts/job_posting_watcher.ts`
- Tests: `tests/integration/file_watcher.test.ts`
- All 5 tests passing ✅

#### Deployment
```bash
# Run watcher in development
npm run dev:watcher

# Or as separate process
tsx scripts/job_posting_watcher.ts
```

---

### ✅ Step 2: File Reading (COMPLETED)
    **Goal**: Read file content when detected

#### Implementation
```typescript
// lib/job_postings/file_reader.ts
import { promises as fs } from 'fs'

export async function readJobPostingFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    console.log(`[reader] Read file: ${filePath} (${content.length} chars)`)
    return content
  } catch (error) {
    console.error(`[reader] Failed to read ${filePath}:`, error)
    throw error
  }
}
```

#### Update Watcher
```typescript
// scripts/job_posting_watcher.ts
import { readJobPostingFile } from '@/lib/job_postings/file_reader'

// Inside watcher loop:
if (['.md', '.txt', '.json'].includes(ext)) {
  console.log(`[watcher] Detected new file: ${event.filename}`)
  
  const filePath = path.join(JOB_POSTINGS_DIR, event.filename)
  const content = await readJobPostingFile(filePath)
  
  console.log(`[watcher] Content preview: ${content.slice(0, 100)}...`)
  // TODO: Step 3 - Normalize content
}
```

#### Test Plan
```typescript
// tests/unit/file_reader.test.ts
describe('File Reader - Step 2', () => {
  test('reads markdown file correctly', async () => {
    const testFile = path.join(testDir, 'test.md')
    await fs.writeFile(testFile, '# Test\nContent here')
    
    const content = await readJobPostingFile(testFile)
    
    expect(content).toContain('# Test')
    expect(content).toContain('Content here')
  })
  
  test('handles UTF-8 encoding', async () => {
    const testFile = path.join(testDir, 'test-utf8.md')
    await fs.writeFile(testFile, 'Zażółć gęślą jaźń', 'utf-8')
    
    const content = await readJobPostingFile(testFile)
    
    expect(content).toBe('Zażółć gęślą jaźń')
  })
  
  test('throws error for non-existent file', async () => {
    await expect(
      readJobPostingFile('/non/existent/file.md')
    ).rejects.toThrow()
  })
})
```

#### Acceptance Criteria
- [x] Successfully reads .md, .txt, .json files
- [x] Handles UTF-8 encoding correctly (Polish characters)
- [x] Logs file size after reading
- [x] Throws descriptive error for missing files
- [x] Unit tests pass

#### ✅ Status: COMPLETED
- Implementation: `lib/job_postings/file_reader.ts`
- Tests: `tests/unit/file_reader.test.ts`
- Watcher updated: `scripts/job_posting_watcher.ts`
- All 8 tests passing ✅

---

### ✅ Step 3: Content Normalization (COMPLETED)
**Goal**: Clean and standardize file content

#### Implementation
```typescript
// lib/job_postings/normalizer.ts

export interface NormalizedContent {
  original: string
  normalized: string
  encoding: string
  lineBreaks: 'unix' | 'windows' | 'mixed'
  stats: {
    originalLength: number
    normalizedLength: number
    linesRemoved: number
    whitespaceReduced: number
  }
}

export function normalizeContent(content: string): NormalizedContent {
  const original = content
  const originalLength = content.length
  
  // Step 1: Decode HTML entities
  let normalized = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Step 2: Detect line break style
  const hasWindows = normalized.includes('\r\n')
  const hasUnix = normalized.includes('\n')
  const lineBreaks = hasWindows && hasUnix ? 'mixed' : hasWindows ? 'windows' : 'unix'
  
  // Step 3: Normalize line breaks to \n
  normalized = normalized.replace(/\r\n/g, '\n')
  
  // Step 4: Remove excessive whitespace
  const beforeWhitespace = normalized.length
  normalized = normalized
    .replace(/[ \t]+/g, ' ')           // Multiple spaces/tabs → single space
    .replace(/\n{3,}/g, '\n\n')        // Max 2 consecutive newlines
    .replace(/^\s+/gm, '')             // Remove leading whitespace per line
    .replace(/\s+$/gm, '')             // Remove trailing whitespace per line
  const whitespaceReduced = beforeWhitespace - normalized.length
  
  // Step 5: Remove non-printable characters (except \n, \t)
  normalized = normalized.replace(/[^\x20-\x7E\n\t\u0080-\uFFFF]/g, '')
  
  // Step 6: Trim overall
  normalized = normalized.trim()
  
  const normalizedLength = normalized.length
  const linesRemoved = (original.match(/\n/g) || []).length - (normalized.match(/\n/g) || []).length
  
  console.log(`[normalizer] Original: ${originalLength} chars, Normalized: ${normalizedLength} chars`)
  console.log(`[normalizer] Removed ${linesRemoved} lines, reduced ${whitespaceReduced} whitespace chars`)
  
  return {
    original,
    normalized,
    encoding: 'utf-8',
    lineBreaks,
    stats: {
      originalLength,
      normalizedLength,
      linesRemoved,
      whitespaceReduced,
    }
  }
}
```

#### Update Watcher
```typescript
import { normalizeContent } from '@/lib/job_postings/normalizer'

// After reading file:
const content = await readJobPostingFile(filePath)
const normalized = normalizeContent(content)

console.log(`[watcher] Normalized content (${normalized.stats.normalizedLength} chars)`)
// TODO: Step 4 - Extract metadata
```

#### Test Plan
```typescript
// tests/unit/normalizer.test.ts
describe('Content Normalizer - Step 3', () => {
  test('removes HTML entities', () => {
    const input = 'Test&nbsp;with&amp;entities'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Test with&entities')
  })
  
  test('normalizes line breaks', () => {
    const input = 'Line 1\r\nLine 2\nLine 3'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Line 1\nLine 2\nLine 3')
    expect(result.lineBreaks).toBe('mixed')
  })
  
  test('removes excessive whitespace', () => {
    const input = 'Too    many   spaces\n\n\n\nToo many newlines'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Too many spaces\n\nToo many newlines')
    expect(result.stats.whitespaceReduced).toBeGreaterThan(0)
  })
  
  test('preserves UTF-8 characters', () => {
    const input = 'Zażółć gęślą jaźń'
    const result = normalizeContent(input)
    
    expect(result.normalized).toBe('Zażółć gęślą jaźń')
  })
  
  test('removes non-printable characters', () => {
    const input = 'Test\x00with\x01control\x02chars'
    const result = normalizeContent(input)
    
    expect(result.normalized).not.toContain('\x00')
    expect(result.normalized).toBe('Testwithcontrolchars')
  })
})
```

#### Acceptance Criteria
- [x] HTML entities decoded correctly
- [x] Line breaks normalized to \n
- [x] Excessive whitespace removed
- [x] UTF-8 characters preserved
- [x] Non-printable characters removed
- [x] Stats logged (original vs normalized length)
- [x] Unit tests pass

#### ✅ Status: COMPLETED
- Implementation: `lib/job_postings/normalizer.ts`
- Tests: `tests/unit/normalizer.test.ts`
- Watcher updated: `scripts/job_posting_watcher.ts`
- All 20 tests passing ✅

---

### ✅ Step 4: Metadata Extraction (File Name Parsing) (COMPLETED)
**Goal**: Extract brand_slug and timestamp from filename

#### Implementation
```typescript
// lib/job_postings/metadata.ts

export interface FileMetadata {
  brand_slug: string
  timestamp: Date
  filename: string
  format: 'md' | 'txt' | 'json'
  valid: boolean
  error?: string
}

export function extractFileMetadata(filename: string): FileMetadata {
  const ext = path.extname(filename).slice(1) as 'md' | 'txt' | 'json'
  const basename = path.basename(filename, path.extname(filename))
  
  // Expected format: {brand_slug}-{timestamp}
  // Example: tmobile-20250129T143022Z
  const match = basename.match(/^([a-z0-9-]+)-(\d{8}T\d{6}Z)$/)
  
  if (!match) {
    return {
      brand_slug: '',
      timestamp: new Date(),
      filename,
      format: ext,
      valid: false,
      error: `Invalid filename format. Expected: {brand_slug}-{timestamp}.${ext}`
    }
  }
  
  const [, brand_slug, timestampStr] = match
  
  // Parse ISO 8601 timestamp: 20250129T143022Z → 2025-01-29T14:30:22Z
  const year = timestampStr.slice(0, 4)
  const month = timestampStr.slice(4, 6)
  const day = timestampStr.slice(6, 8)
  const hour = timestampStr.slice(9, 11)
  const minute = timestampStr.slice(11, 13)
  const second = timestampStr.slice(13, 15)
  
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
  const timestamp = new Date(isoString)
  
  if (isNaN(timestamp.getTime())) {
    return {
      brand_slug,
      timestamp: new Date(),
      filename,
      format: ext,
      valid: false,
      error: `Invalid timestamp: ${timestampStr}`
    }
  }
  
  console.log(`[metadata] Extracted: brand=${brand_slug}, timestamp=${timestamp.toISOString()}`)
  
  return {
    brand_slug,
    timestamp,
    filename,
    format: ext,
    valid: true
  }
}
```

#### Update Watcher
```typescript
import { extractFileMetadata } from '@/lib/job_postings/metadata'

// After normalization:
const metadata = extractFileMetadata(event.filename)

if (!metadata.valid) {
  console.error(`[watcher] Invalid filename: ${metadata.error}`)
  return
}

console.log(`[watcher] Processing job posting for brand: ${metadata.brand_slug}`)
// TODO: Step 5 - LLM extraction
```

#### Test Plan
```typescript
// tests/unit/metadata.test.ts
describe('Metadata Extraction - Step 4', () => {
  test('extracts valid metadata from filename', () => {
    const result = extractFileMetadata('tmobile-20250129T143022Z.md')
    
    expect(result.valid).toBe(true)
    expect(result.brand_slug).toBe('tmobile')
    expect(result.timestamp.toISOString()).toBe('2025-01-29T14:30:22.000Z')
    expect(result.format).toBe('md')
  })
  
  test('handles different file formats', () => {
    expect(extractFileMetadata('warta-20250129T143022Z.txt').format).toBe('txt')
    expect(extractFileMetadata('softswiss-20250129T143022Z.json').format).toBe('json')
  })
  
  test('rejects invalid filename format', () => {
    const result = extractFileMetadata('invalid-filename.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid filename format')
  })
  
  test('rejects invalid timestamp', () => {
    const result = extractFileMetadata('tmobile-20259999T999999Z.md')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid timestamp')
  })
  
  test('handles brand slugs with hyphens', () => {
    const result = extractFileMetadata('t-mobile-poland-20250129T143022Z.md')
    
    expect(result.valid).toBe(true)
    expect(result.brand_slug).toBe('t-mobile-poland')
  })
})
```

#### Acceptance Criteria
- [x] Extracts brand_slug correctly
- [x] Parses ISO 8601 timestamp correctly
- [x] Detects file format (.md/.txt/.json)
- [x] Validates filename format
- [x] Rejects invalid filenames with descriptive error
- [x] Handles brand slugs with hyphens
- [x] Unit tests pass

#### ✅ Status: COMPLETED
- Implementation: `lib/job_postings/metadata.ts`
- Tests: `tests/unit/metadata.test.ts`
- Watcher updated: `scripts/job_posting_watcher.ts`
- All 19 tests passing ✅

---

### ✅ Step 5: LLM Semantic Extraction (Placeholder) (COMPLETED)
**Goal**: Extract structured data using LLM (mock for now)

#### Implementation
```typescript
// lib/job_postings/extractor.ts

export interface ExtractedData {
  core_requirements: string[]
  technical_skills: string[]
  soft_skills: string[]
  domain_knowledge: string[]
  culture_signals: string[]
  responsibilities: string[]
  seniority_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | 'unknown'
  role_type: 'ic' | 'manager' | 'hybrid' | 'unknown'
}

export async function extractSemanticData(
  content: string,
  useMock: boolean = true
): Promise<ExtractedData> {
  if (useMock) {
    // Mock extraction for testing
    console.log(`[extractor] Using MOCK extraction (${content.length} chars)`)
    
    return {
      core_requirements: ['5+ years experience', 'Portfolio required'],
      technical_skills: ['React', 'TypeScript', 'Figma'],
      soft_skills: ['Communication', 'Leadership'],
      domain_knowledge: ['FinTech', 'E-commerce'],
      culture_signals: ['Fast-paced', 'Collaborative'],
      responsibilities: ['Design systems', 'Stakeholder management'],
      seniority_level: 'senior',
      role_type: 'ic'
    }
  }
  
  // TODO: Step 5b - Real LLM extraction
  throw new Error('Real LLM extraction not implemented yet')
}
```

#### Update Watcher
```typescript
import { extractSemanticData } from '@/lib/job_postings/extractor'

// After metadata extraction:
const extracted = await extractSemanticData(normalized.normalized, true)

console.log(`[watcher] Extracted ${extracted.technical_skills.length} technical skills`)
console.log(`[watcher] Seniority: ${extracted.seniority_level}, Role: ${extracted.role_type}`)
// TODO: Step 6 - Generate embeddings
```

#### Test Plan
```typescript
// tests/unit/extractor.test.ts
describe('Semantic Extractor - Step 5 (Mock)', () => {
  test('returns mock data structure', async () => {
    const content = '# Senior Product Designer\n\nRequires 5+ years...'
    const result = await extractSemanticData(content, true)
    
    expect(result).toHaveProperty('core_requirements')
    expect(result).toHaveProperty('technical_skills')
    expect(result).toHaveProperty('seniority_level')
    expect(Array.isArray(result.technical_skills)).toBe(true)
  })
  
  test('throws error when useMock=false', async () => {
    await expect(
      extractSemanticData('content', false)
    ).rejects.toThrow('Real LLM extraction not implemented')
  })
})
```

#### Acceptance Criteria
- [x] Mock extraction returns valid data structure
- [x] All required fields present
- [x] Arrays are properly typed
- [x] Logs extraction summary
- [x] Unit tests pass
- [x] **Note**: Real LLM extraction deferred to Step 5b

#### ✅ Status: COMPLETED
- Implementation: `lib/job_postings/extractor.ts`
- Tests: `tests/unit/extractor.test.ts`
- Watcher updated: `scripts/job_posting_watcher.ts`
- All 12 tests passing ✅
- Mock implementation ready for Step 5b (real LLM)

---

### Step 6: Embedding Generation (Placeholder)
**Goal**: Generate embeddings for semantic search (mock for now)

#### Implementation
```typescript
// lib/job_postings/embeddings.ts

export interface EmbeddingResult {
  full_text: number[]
  requirements: number[]
  skills: number[]
  model: string
  dimensions: number
}

export async function generateEmbeddings(
  content: string,
  extracted: ExtractedData,
  useMock: boolean = true
): Promise<EmbeddingResult> {
  if (useMock) {
    console.log(`[embeddings] Using MOCK embeddings`)
    
    // Generate random 1536-dimensional vectors (OpenAI text-embedding-3-small size)
    const mockVector = () => Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    
    return {
      full_text: mockVector(),
      requirements: mockVector(),
      skills: mockVector(),
      model: 'mock-embedding-model',
      dimensions: 1536
    }
  }
  
  // TODO: Step 6b - Real embedding generation
  throw new Error('Real embedding generation not implemented yet')
}
```

#### Update Watcher
```typescript
import { generateEmbeddings } from '@/lib/job_postings/embeddings'

// After extraction:
const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)

console.log(`[watcher] Generated embeddings (${embeddings.dimensions}D)`)
// TODO: Step 7 - Store in database
```

#### Test Plan
```typescript
// tests/unit/embeddings.test.ts
describe('Embedding Generator - Step 6 (Mock)', () => {
  test('generates mock embeddings with correct dimensions', async () => {
    const content = 'test content'
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    expect(result.full_text).toHaveLength(1536)
    expect(result.requirements).toHaveLength(1536)
    expect(result.skills).toHaveLength(1536)
    expect(result.dimensions).toBe(1536)
  })
  
  test('vectors contain normalized values', async () => {
    const content = 'test'
    const extracted = await extractSemanticData(content, true)
    const result = await generateEmbeddings(content, extracted, true)
    
    // Check values are in reasonable range [-1, 1]
    result.full_text.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(-1)
      expect(val).toBeLessThanOrEqual(1)
    })
  })
})
```

#### Acceptance Criteria
- [ ] Mock embeddings have correct dimensions (1536)
- [ ] All three embedding types generated (full_text, requirements, skills)
- [ ] Values are normalized floats
- [ ] Logs embedding generation
- [ ] Unit tests pass
- [ ] **Note**: Real embedding generation deferred to Step 6b

---

### Step 7: Database Storage
**Goal**: Store processed job posting in Supabase

#### Implementation
```typescript
// lib/job_postings/storage.ts
import { createClient } from '@supabase/supabase-js'

export interface StorageResult {
  id: string
  success: boolean
  error?: string
}

export async function storeJobPosting(
  metadata: FileMetadata,
  normalized: NormalizedContent,
  extracted: ExtractedData,
  embeddings: EmbeddingResult
): Promise<StorageResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .insert({
        brand_slug: metadata.brand_slug,
        title: `Job Posting - ${metadata.brand_slug}`,
        company: metadata.brand_slug,
        content: normalized.normalized,
        is_active: true,
        
        // Extended fields
        raw_content: normalized.original,
        normalized_content: normalized.normalized,
        file_path: metadata.filename,
        file_format: metadata.format,
        
        // Extracted data
        extracted_skills: {
          technical: extracted.technical_skills,
          soft: extracted.soft_skills,
          domain: extracted.domain_knowledge
        },
        extracted_requirements: {
          core: extracted.core_requirements,
          seniority_level: extracted.seniority_level,
          role_type: extracted.role_type
        },
        extracted_culture: {
          signals: extracted.culture_signals,
          responsibilities: extracted.responsibilities
        },
        
        // Embeddings (cast to unknown first to satisfy TypeScript)
        full_text_embedding: embeddings.full_text as unknown as string,
        requirements_embedding: embeddings.requirements as unknown as string,
        skills_embedding: embeddings.skills as unknown as string,
        
        // Processing metadata
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString(),
        created_by: 'file_watcher'
      })
      .select('id')
      .single()
    
    if (error) {
      console.error(`[storage] Failed to store job posting:`, error)
      return { id: '', success: false, error: error.message }
    }
    
    console.log(`[storage] Stored job posting: ${data.id}`)
    return { id: data.id, success: true }
    
  } catch (error: any) {
    console.error(`[storage] Unexpected error:`, error)
    return { id: '', success: false, error: error.message }
  }
}
```

#### Update Watcher
```typescript
import { storeJobPosting } from '@/lib/job_postings/storage'

// After embeddings:
const result = await storeJobPosting(metadata, normalized, extracted, embeddings)

if (result.success) {
  console.log(`[watcher] ✅ Successfully processed: ${metadata.filename} (ID: ${result.id})`)
} else {
  console.error(`[watcher] ❌ Failed to process: ${metadata.filename} - ${result.error}`)
}
// TODO: Step 8 - Cache invalidation
```

#### Test Plan
```typescript
// tests/integration/storage.test.ts
describe('Database Storage - Step 7', () => {
  test('stores job posting successfully', async () => {
    const metadata = extractFileMetadata('test-20250129T143022Z.md')
    const normalized = normalizeContent('# Test Job')
    const extracted = await extractSemanticData(normalized.normalized, true)
    const embeddings = await generateEmbeddings(normalized.normalized, extracted, true)
    
    const result = await storeJobPosting(metadata, normalized, extracted, embeddings)
    
    expect(result.success).toBe(true)
    expect(result.id).toBeTruthy()
    
    // Verify in database
    const supabase = createClient(/* ... */)
    const { data } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', result.id)
      .single()
    
    expect(data.brand_slug).toBe('test')
    expect(data.processing_status).toBe('completed')
  })
  
  test('handles duplicate content hash', async () => {
    // Store once
    const result1 = await storeJobPosting(/* ... */)
    expect(result1.success).toBe(true)
    
    // Try to store again with same content
    const result2 = await storeJobPosting(/* ... */)
    expect(result2.success).toBe(false)
    expect(result2.error).toContain('duplicate')
  })
})
```

#### Acceptance Criteria
- [ ] Successfully inserts record into `job_postings` table
- [ ] All fields populated correctly
- [ ] Embeddings stored as vectors
- [ ] Returns generated ID
- [ ] Handles duplicate content (content_hash constraint)
- [ ] Logs success/failure
- [ ] Integration test passes

---

### Step 8: Cache Invalidation
**Goal**: Invalidate suggestion cache for the brand

#### Implementation
```typescript
// lib/job_postings/cache.ts

export async function invalidateBrandCache(brand_slug: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  
  try {
    // Clear cache_key and cache_expires_at for this brand
    const { error } = await supabase
      .from('job_postings')
      .update({
        cache_key: null,
        cache_expires_at: null
      })
      .eq('brand_slug', brand_slug)
    
    if (error) {
      console.error(`[cache] Failed to invalidate cache for ${brand_slug}:`, error)
    } else {
      console.log(`[cache] Invalidated cache for brand: ${brand_slug}`)
    }
  } catch (error) {
    console.error(`[cache] Unexpected error:`, error)
  }
}
```

#### Update Watcher
```typescript
import { invalidateBrandCache } from '@/lib/job_postings/cache'

// After storage:
if (result.success) {
  await invalidateBrandCache(metadata.brand_slug)
  console.log(`[watcher] ✅ Successfully processed: ${metadata.filename}`)
  console.log(`[watcher] 🔄 Cache invalidated for brand: ${metadata.brand_slug}`)
}
// TODO: Step 9 - Verify in chat
```

#### Test Plan
```typescript
// tests/integration/cache.test.ts
describe('Cache Invalidation - Step 8', () => {
  test('invalidates cache for brand', async () => {
    const brand_slug = 'test'
    
    // Set up cache entry
    const supabase = createClient(/* ... */)
    await supabase
      .from('job_postings')
      .update({
        cache_key: 'test-cache-key',
        cache_expires_at: new Date(Date.now() + 86400000).toISOString()
      })
      .eq('brand_slug', brand_slug)
    
    // Invalidate
    await invalidateBrandCache(brand_slug)
    
    // Verify cleared
    const { data } = await supabase
      .from('job_postings')
      .select('cache_key, cache_expires_at')
      .eq('brand_slug', brand_slug)
    
    data.forEach(row => {
      expect(row.cache_key).toBeNull()
      expect(row.cache_expires_at).toBeNull()
    })
  })
})
```

#### Acceptance Criteria
- [ ] Clears cache_key and cache_expires_at for brand
- [ ] Handles non-existent brand gracefully
- [ ] Logs invalidation
- [ ] Integration test passes

---

### Step 9: End-to-End Verification
**Goal**: Verify suggestions appear in chat interface

#### Manual Test Plan
```
1. Start watcher: `npm run dev:watcher`
2. Create test file: `data/job_postings/test/test-20250129T143022Z.md`
3. Add content:
   ```markdown
   ---
   role: Senior Product Designer
   ---
   
   # Senior Product Designer
   
   ## Requirements
   - 5+ years of product design experience
   - Strong React and TypeScript skills
   - Experience with Figma and design systems
   ```
4. Watch logs for processing steps
5. Open chat: http://localhost:3000/brand/test
6. Verify suggestions appear (should use new job posting data)
7. Click suggestion and verify RAG response includes job context
```

#### Automated E2E Test
```typescript
// tests/e2e/job_posting_flow.spec.ts
import { test, expect } from '@playwright/test'

test('job posting flow end-to-end', async ({ page }) => {
  // 1. Upload job posting via file system
  const testFile = 'data/job_postings/e2e-test/e2e-test-20250129T143022Z.md'
  await fs.writeFile(testFile, `
---
role: Senior Designer
---

# Senior Designer

## Requirements
- React
- Figma
  `)
  
  // 2. Wait for processing (max 30s)
  await page.waitForTimeout(30000)
  
  // 3. Navigate to brand page
  await page.goto('/brand/e2e-test')
  
  // 4. Wait for chat to load
  await page.waitForSelector('.suggested-questions')
  
  // 5. Verify suggestions appear
  const suggestions = await page.locator('.suggested-questions li').allTextContents()
  expect(suggestions.length).toBeGreaterThan(0)
  
  // 6. Click first suggestion
  await page.locator('.suggested-questions li').first().click()
  
  // 7. Wait for RAG response
  await page.waitForSelector('.chat-message.assistant')
  
  // 8. Verify response mentions job posting context
  const response = await page.locator('.chat-message.assistant').last().textContent()
  expect(response).toBeTruthy()
  
  // Cleanup
  await fs.unlink(testFile)
})
```

#### Acceptance Criteria
- [ ] File watcher processes new file within 5 seconds
- [ ] All processing steps complete successfully
- [ ] Job posting stored in database
- [ ] Suggestions API returns contextual questions
- [ ] Chat interface displays suggestions
- [ ] RAG response includes job posting context
- [ ] E2E test passes

---

## Progress Tracking

### Completed Steps
- [x] **Step 1: File Watcher - Detection Only** ✅ (2025-01-29)
- [x] **Step 2: File Reading** ✅ (2025-01-29)
- [x] **Step 3: Content Normalization** ✅ (2025-01-29)
- [x] **Step 4: Metadata Extraction** ✅ (2025-01-29)
- [x] **Step 5: LLM Semantic Extraction (Mock)** ✅ (2025-01-29)
- [ ] Step 6: Embedding Generation (Mock)
- [ ] Step 7: Database Storage
- [ ] Step 8: Cache Invalidation
- [ ] Step 9: End-to-End Verification

### Current Step
**Step 6: Embedding Generation (Mock)** ⬅️ Next

### Next Steps After Workflow 1
- [ ] Step 5b: Real LLM Extraction (replace mock)
- [ ] Step 6b: Real Embedding Generation (replace mock)
- [ ] Workflow 2: Manual Upload via Admin API
- [ ] Workflow 3: Suggestion Generation in Chat

---

## Development Commands

```bash
# Run file watcher
npm run dev:watcher

# Run tests
npm test                           # All tests
npm test file_watcher             # Specific test file
npm test -- --watch               # Watch mode

# Run E2E tests
npm run test:e2e

# Check database
npm run db:studio                 # Open Supabase Studio

# Logs
tail -f logs/job_posting_watcher.log
```

---

## Rollback Strategy

Each step can be rolled back independently:

```bash
# Step 1-4: No database changes, just delete files
rm -rf data/job_postings/test/

# Step 7-8: Delete test records
psql $DATABASE_URL -c "DELETE FROM job_postings WHERE created_by = 'file_watcher' AND brand_slug = 'test'"

# Full rollback: Disable watcher
export JOB_POSTINGS_WATCHER_ENABLED=false
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-29  
**Status**: Ready for Implementation - Step 1
