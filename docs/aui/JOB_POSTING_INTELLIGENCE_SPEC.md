# Job Posting Intelligence Integration - Technical Specification

## Overview

Automated system for ingesting, analyzing, and leveraging job posting content to generate contextual, intelligent question suggestions in the RAG chat interface.

**Parent Task**: [LL-1.1 Job Posting Intelligence Integration](./LIVING_LAYOUTS_IMPLEMENTATION.md#ll-11-job-posting-intelligence-integration)

---

## 1. Content Delivery Flow

### 1.1 Input Sources

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Sources                           │
├─────────────────────────────────────────────────────────────┤
│ 1. File System (Primary)                                    │
│    └─ data/job_postings/{brand_slug}/                       │
│       ├─ {brand_slug}-{timestamp}.md                        │
│       ├─ {brand_slug}-{timestamp}.txt                       │
│       └─ {brand_slug}-{timestamp}.json                      │
│                                                              │
│ 2. Admin API (Secondary)                                    │
│    └─ POST /api/admin/job-postings                          │
│       Body: { brand_slug, content, metadata }               │
│                                                              │
│ 3. Campaign MDX Frontmatter (Fallback)                      │
│    └─ data/campaigns/{brand_slug}.mdx                       │
│       Frontmatter: job_description, requirements, etc.      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Processing Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Detect     │───▶│  Normalize   │───▶│   Analyze    │───▶│    Store     │
│   New File   │    │   Content    │    │  Semantics   │    │   Results    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      │                    │                    │                    │
      ▼                    ▼                    ▼                    ▼
  File watcher      Format detection    LLM extraction      Supabase DB
  Cron job          Text cleaning       Entity recognition   + embeddings
  Manual trigger    Encoding fix        Section parsing      + cache
```

---

## 2. File Format Standards

### 2.1 Supported Formats

#### **Markdown (.md)** - Preferred
```markdown
---
brand: tmobile
role: Senior Product Designer
location: Warsaw, Poland
employment_type: full-time
experience_level: senior
posted_date: 2025-01-15
---

# Senior Product Designer - T-Mobile Poland

## About the Role
[Job description content...]

## Requirements
- 5+ years of product design experience
- Strong portfolio demonstrating end-to-end design process
- Experience with design systems and component libraries

## Responsibilities
[Responsibilities content...]

## Nice to Have
[Optional skills...]

## Benefits
[Benefits content...]
```

#### **Plain Text (.txt)** - Supported
```
ROLE: Senior Product Designer
COMPANY: T-Mobile Poland
LOCATION: Warsaw
TYPE: Full-time

DESCRIPTION:
[Job description content...]

REQUIREMENTS:
- 5+ years of product design experience
...
```

#### **JSON (.json)** - Structured
```json
{
  "brand": "tmobile",
  "role": "Senior Product Designer",
  "location": "Warsaw, Poland",
  "employment_type": "full-time",
  "experience_level": "senior",
  "posted_date": "2025-01-15",
  "sections": {
    "description": "...",
    "requirements": ["...", "..."],
    "responsibilities": ["...", "..."],
    "nice_to_have": ["...", "..."],
    "benefits": ["...", "..."]
  }
}
```

### 2.2 File Naming Convention

```
Pattern: {brand_slug}-{timestamp}.{ext}
Examples:
  - tmobile-20250115T143022Z.md
  - softswiss-20250116T091500Z.txt
  - warta-20250117T120000Z.json

Rules:
  - brand_slug: lowercase, alphanumeric + hyphens, max 63 chars
  - timestamp: ISO 8601 format (YYYYMMDDTHHMMSSZ)
  - ext: md | txt | json
```

---

## 3. Content Normalization

### 3.1 Text Cleaning Pipeline

```typescript
interface NormalizationPipeline {
  steps: [
    'decodeHtmlEntities',      // &nbsp; → space, &amp; → &
    'removeExcessWhitespace',  // Multiple spaces → single space
    'normalizeLineBreaks',     // \r\n → \n, multiple \n → max 2
    'stripInvalidChars',       // Remove non-printable characters
    'fixEncoding',             // UTF-8 validation and repair
    'trimSections',            // Remove leading/trailing whitespace per section
    'deduplicateBullets'       // Remove duplicate list items
  ]
}
```

### 3.2 Section Detection

**Heuristic Rules:**
```typescript
const SECTION_PATTERNS = {
  description: /^(about|description|overview|role|position)/i,
  requirements: /^(requirements|qualifications|must.have|essential)/i,
  responsibilities: /^(responsibilities|duties|what.you.ll.do)/i,
  nice_to_have: /^(nice.to.have|preferred|bonus|plus)/i,
  benefits: /^(benefits|perks|what.we.offer|compensation)/i,
  company: /^(about.us|company|who.we.are)/i,
}

// Fallback: Use LLM for ambiguous sections
```

### 3.3 Token Limit Enforcement

```typescript
const TOKEN_LIMITS = {
  total: 4000,              // Max tokens for entire posting
  description: 1000,        // Max per section
  requirements: 800,
  responsibilities: 800,
  nice_to_have: 400,
  benefits: 400,
  company: 600,
}

// Truncation strategy: Keep first N tokens, add "..." indicator
```

---

## 4. Semantic Analysis

### 4.1 LLM Extraction Prompt

```typescript
const EXTRACTION_PROMPT = `
You are analyzing a job posting to extract structured information.

INPUT:
${jobPostingContent}

EXTRACT:
1. Core Requirements (must-have skills, experience, education)
2. Technical Skills (tools, frameworks, methodologies)
3. Soft Skills (communication, leadership, collaboration)
4. Domain Knowledge (industry-specific expertise)
5. Company Culture Signals (values, work style, team dynamics)
6. Key Responsibilities (main duties, deliverables)
7. Seniority Level (entry/mid/senior/lead/executive)
8. Role Type (IC/manager/hybrid)

OUTPUT FORMAT (strict JSON):
{
  "core_requirements": ["...", "..."],
  "technical_skills": ["...", "..."],
  "soft_skills": ["...", "..."],
  "domain_knowledge": ["...", "..."],
  "culture_signals": ["...", "..."],
  "responsibilities": ["...", "..."],
  "seniority_level": "senior",
  "role_type": "ic"
}

RULES:
- Be specific and concise (3-10 words per item)
- Extract only explicitly stated requirements
- Normalize skill names (e.g., "React.js" → "React")
- Identify implicit requirements (e.g., "5+ years" → "senior")
- Max 15 items per category
`
```

### 4.2 Entity Recognition

```typescript
interface ExtractedEntities {
  skills: {
    technical: string[]      // React, Figma, TypeScript, SQL
    soft: string[]           // Leadership, Communication, Problem-solving
    domain: string[]         // FinTech, Healthcare, E-commerce
  }
  requirements: {
    experience_years: number // 5
    education: string[]      // Bachelor's in CS, Master's preferred
    certifications: string[] // PMP, AWS Certified, etc.
  }
  culture: {
    values: string[]         // Innovation, Collaboration, Ownership
    work_style: string[]     // Remote-first, Agile, Fast-paced
    team_size: string        // Small team (5-10), Large org (500+)
  }
  compensation: {
    salary_range?: { min: number, max: number, currency: string }
    benefits: string[]       // Health insurance, Stock options, etc.
  }
}
```

### 4.3 Embedding Generation

```typescript
// Generate embeddings for semantic search
const embeddingTargets = [
  jobPosting.full_text,           // Full posting (truncated to 4000 tokens)
  jobPosting.requirements_text,   // Requirements section only
  jobPosting.skills_concatenated, // All skills as single string
]

// Store in job_postings.embeddings (vector[1536])
```

---

## 5. File System Watcher

### 5.1 Implementation Strategy

```typescript
// Option A: Node.js fs.watch (development)
import { watch } from 'fs/promises'

const watcher = watch('data/job_postings', { recursive: true })
for await (const event of watcher) {
  if (event.eventType === 'rename' && isValidJobPostingFile(event.filename)) {
    await processJobPosting(event.filename)
  }
}

// Option B: Chokidar (production-ready)
import chokidar from 'chokidar'

chokidar.watch('data/job_postings/**/*.{md,txt,json}', {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  persistent: true,
  ignoreInitial: false,
}).on('add', async (path) => {
  await processJobPosting(path)
})

// Option C: Cron job (serverless-friendly)
// Run every 5 minutes, check for new files
```

### 5.2 Processing Queue

```typescript
interface ProcessingQueue {
  pending: JobPostingFile[]
  processing: JobPostingFile[]
  completed: JobPostingFile[]
  failed: JobPostingFile[]
}

// Prevent duplicate processing
const lockFile = `data/job_postings/.processing/${filename}.lock`

// Retry logic
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000
```

---

## 6. Database Schema

### 6.1 Enhanced job_postings Table

```sql
-- Extend existing table
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS
  raw_content TEXT,                    -- Original file content
  normalized_content TEXT,             -- Cleaned content
  content_hash TEXT UNIQUE,            -- SHA-256 for deduplication
  file_path TEXT,                      -- Original file path
  file_format TEXT CHECK (file_format IN ('md', 'txt', 'json')),
  
  -- Extracted entities (JSONB for flexibility)
  extracted_skills JSONB,              -- { technical: [], soft: [], domain: [] }
  extracted_requirements JSONB,        -- { experience_years, education, etc. }
  extracted_culture JSONB,             -- { values, work_style, team_size }
  extracted_compensation JSONB,        -- { salary_range, benefits }
  
  -- Embeddings for semantic search
  full_text_embedding VECTOR(1536),
  requirements_embedding VECTOR(1536),
  skills_embedding VECTOR(1536),
  
  -- Processing metadata
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  processing_retries INTEGER DEFAULT 0,
  
  -- Cache metadata
  cache_key TEXT,
  cache_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Audit trail
  created_by TEXT,                     -- 'file_watcher' | 'admin_api' | 'manual'
  updated_by TEXT;

-- Indexes for performance
CREATE INDEX idx_job_postings_content_hash ON public.job_postings(content_hash);
CREATE INDEX idx_job_postings_processing_status ON public.job_postings(processing_status);
CREATE INDEX idx_job_postings_cache_expires ON public.job_postings(cache_expires_at);

-- Vector similarity search indexes
CREATE INDEX idx_job_postings_full_text_embedding ON public.job_postings 
  USING ivfflat (full_text_embedding vector_cosine_ops) WITH (lists = 100);
```

### 6.2 Processing Log Table

```sql
CREATE TABLE IF NOT EXISTS public.job_posting_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN ('detected', 'started', 'completed', 'failed', 'retried')),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  file_path TEXT,
  file_size_bytes INTEGER,
  processing_duration_ms INTEGER,
  
  error_message TEXT,
  error_stack TEXT,
  
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_processing_logs_job_posting ON public.job_posting_processing_logs(job_posting_id);
CREATE INDEX idx_processing_logs_event_type ON public.job_posting_processing_logs(event_type);
CREATE INDEX idx_processing_logs_timestamp ON public.job_posting_processing_logs(event_timestamp DESC);
```

---

## 7. API Endpoints

### 7.1 Admin API - Manual Upload

```typescript
// POST /api/admin/job-postings
interface UploadJobPostingRequest {
  brand_slug: string
  content: string
  format: 'md' | 'txt' | 'json'
  metadata?: {
    role?: string
    location?: string
    employment_type?: string
    experience_level?: string
    posted_date?: string
  }
}

interface UploadJobPostingResponse {
  id: string
  brand_slug: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  message: string
}
```

### 7.2 Processing Trigger API

```typescript
// POST /api/admin/job-postings/process
interface ProcessJobPostingRequest {
  file_path?: string           // Process specific file
  brand_slug?: string          // Process all files for brand
  force_reprocess?: boolean    // Ignore cache, reprocess
}

interface ProcessJobPostingResponse {
  queued: number
  processing: number
  completed: number
  failed: number
  errors: Array<{ file: string, error: string }>
}
```

### 7.3 Status Check API

```typescript
// GET /api/admin/job-postings/status?brand_slug={slug}
interface JobPostingStatusResponse {
  brand_slug: string
  total_postings: number
  active_postings: number
  processing_status: {
    pending: number
    processing: number
    completed: number
    failed: number
  }
  latest_posting: {
    id: string
    created_at: string
    file_path: string
  }
  cache_status: {
    cached: number
    expired: number
  }
}
```

---

## 8. Contextual Question Generation

### 8.1 Dynamic Suggestion Prompt

```typescript
const SUGGESTION_GENERATION_PROMPT = `
You are generating interview questions for a candidate based on a job posting.

JOB POSTING ANALYSIS:
Role: ${analysis.role}
Seniority: ${analysis.seniority_level}
Key Skills: ${analysis.technical_skills.join(', ')}
Core Requirements: ${analysis.core_requirements.join(', ')}
Culture Signals: ${analysis.culture_signals.join(', ')}

CANDIDATE CONTEXT:
Industry: ${candidateIndustry}
Previous Interaction: ${previousQuestions}

GENERATE 5 CONTEXTUAL QUESTIONS:
1. One about specific technical skills mentioned in the posting
2. One about relevant experience for the role
3. One about cultural fit based on company values
4. One about handling key responsibilities
5. One about domain knowledge or industry expertise

RULES:
- Questions should be natural and conversational
- Avoid repeating previous questions
- Be specific to the job posting content
- 8-15 words per question
- Use first person ("Tell me about your experience with...")

OUTPUT FORMAT (JSON):
{
  "suggestions": [
    "Tell me about your experience with React and TypeScript",
    "How have you led design system initiatives in past roles?",
    "Describe a time you worked in a fast-paced, agile environment",
    "What's your approach to stakeholder management in product design?",
    "Share your experience with FinTech compliance and regulations"
  ]
}
`
```

### 8.2 Suggestion Caching Strategy

```typescript
interface SuggestionCache {
  key: string                    // `suggestions:${brand_slug}:${hash(context)}`
  suggestions: string[]
  generated_at: Date
  expires_at: Date               // 24 hours from generation
  hit_count: number
  last_accessed: Date
}

// Cache invalidation triggers:
// 1. New job posting uploaded for brand
// 2. Manual cache clear via admin API
// 3. TTL expiration (24h)
```

---

## 9. Content Retention & Cleanup

### 9.1 Retention Policy

```typescript
const RETENTION_POLICY = {
  active_postings: {
    duration: 'indefinite',
    condition: 'is_active = true'
  },
  inactive_postings: {
    duration: '90 days',
    condition: 'is_active = false AND updated_at < NOW() - INTERVAL \'90 days\''
  },
  processing_logs: {
    duration: '30 days',
    condition: 'created_at < NOW() - INTERVAL \'30 days\''
  },
  cache_entries: {
    duration: '24 hours',
    condition: 'cache_expires_at < NOW()'
  }
}
```

### 9.2 Cleanup Cron Job

```sql
-- Run daily at 2 AM UTC
-- Delete inactive postings older than 90 days
DELETE FROM public.job_postings
WHERE is_active = false
  AND updated_at < NOW() - INTERVAL '90 days';

-- Delete old processing logs
DELETE FROM public.job_posting_processing_logs
WHERE created_at < NOW() - INTERVAL '30 days';

-- Clear expired cache entries
UPDATE public.job_postings
SET cache_key = NULL, cache_expires_at = NULL
WHERE cache_expires_at < NOW();

-- Archive to cold storage (optional)
INSERT INTO public.job_postings_archive
SELECT * FROM public.job_postings
WHERE is_active = false
  AND updated_at < NOW() - INTERVAL '180 days';
```

### 9.3 File System Cleanup

```typescript
// Clean up processed files from data/job_postings/
const FILE_RETENTION_DAYS = 30

async function cleanupProcessedFiles() {
  const files = await fs.readdir('data/job_postings', { recursive: true })
  
  for (const file of files) {
    const stats = await fs.stat(file)
    const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)
    
    if (ageInDays > FILE_RETENTION_DAYS) {
      // Check if processed in DB
      const processed = await db.query(
        'SELECT id FROM job_postings WHERE file_path = $1 AND processing_status = $2',
        [file, 'completed']
      )
      
      if (processed.rows.length > 0) {
        await fs.unlink(file)
        console.log(`Deleted processed file: ${file}`)
      }
    }
  }
}
```

---

## 10. Error Handling & Monitoring

### 10.1 Error Categories

```typescript
enum ProcessingError {
  FILE_NOT_FOUND = 'file_not_found',
  INVALID_FORMAT = 'invalid_format',
  PARSING_FAILED = 'parsing_failed',
  LLM_TIMEOUT = 'llm_timeout',
  LLM_RATE_LIMIT = 'llm_rate_limit',
  EMBEDDING_FAILED = 'embedding_failed',
  DB_INSERT_FAILED = 'db_insert_failed',
  CONTENT_TOO_LARGE = 'content_too_large',
  DUPLICATE_CONTENT = 'duplicate_content',
}
```

### 10.2 Retry Strategy

```typescript
const RETRY_CONFIG = {
  max_retries: 3,
  backoff: 'exponential',        // 5s, 10s, 20s
  retry_on: [
    ProcessingError.LLM_TIMEOUT,
    ProcessingError.LLM_RATE_LIMIT,
    ProcessingError.EMBEDDING_FAILED,
  ],
  no_retry_on: [
    ProcessingError.INVALID_FORMAT,
    ProcessingError.CONTENT_TOO_LARGE,
    ProcessingError.DUPLICATE_CONTENT,
  ]
}
```

### 10.3 Monitoring Metrics

```typescript
interface ProcessingMetrics {
  // Throughput
  files_processed_per_hour: number
  avg_processing_time_ms: number
  
  // Success rate
  success_rate_24h: number
  failure_rate_by_error_type: Record<ProcessingError, number>
  
  // Performance
  llm_latency_p50: number
  llm_latency_p95: number
  embedding_latency_p50: number
  
  // Cache
  cache_hit_rate: number
  cache_size_mb: number
  
  // Alerts
  consecutive_failures: number      // Alert if > 5
  processing_queue_size: number     // Alert if > 50
  oldest_pending_file_age_hours: number  // Alert if > 24
}
```

---

## 11. Security & Privacy

### 11.1 Content Sanitization

```typescript
// Remove PII before storing
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\d{3}-\d{2}-\d{4}/g,
  address: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|circle|cir|boulevard|blvd)/gi,
}

function sanitizeContent(content: string): string {
  let sanitized = content
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    sanitized = sanitized.replace(pattern, `[${type.toUpperCase()}_REDACTED]`)
  }
  return sanitized
}
```

### 11.2 Access Control

```typescript
// RLS policies for job_postings table
CREATE POLICY "Users can view job postings for accessible campaigns"
ON public.job_postings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.brand_slug = job_postings.brand_slug
    AND c.active = true
  )
);

CREATE POLICY "Only admins can insert/update job postings"
ON public.job_postings FOR ALL
USING (auth.jwt() ->> 'email' = 'eof@offline.pl')
WITH CHECK (auth.jwt() ->> 'email' = 'eof@offline.pl');
```

### 11.3 Rate Limiting

```typescript
const RATE_LIMITS = {
  file_uploads: {
    per_brand: 10,              // Max 10 uploads per brand per hour
    per_admin: 50,              // Max 50 uploads per admin per hour
  },
  processing_triggers: {
    per_brand: 5,               // Max 5 manual triggers per brand per hour
  },
  api_calls: {
    llm_extraction: 100,        // Max 100 LLM calls per hour
    embedding_generation: 500,  // Max 500 embedding calls per hour
  }
}
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

```typescript
describe('Job Posting Processing', () => {
  test('normalizes markdown content correctly', async () => {
    const input = readFixture('tmobile-raw.md')
    const normalized = await normalizeContent(input)
    expect(normalized).toMatchSnapshot()
  })
  
  test('extracts requirements from plain text', async () => {
    const input = readFixture('softswiss-raw.txt')
    const extracted = await extractRequirements(input)
    expect(extracted.technical_skills).toContain('React')
    expect(extracted.experience_years).toBe(5)
  })
  
  test('handles duplicate content hash', async () => {
    const content = 'duplicate content'
    await processJobPosting({ content, brand_slug: 'test' })
    await expect(
      processJobPosting({ content, brand_slug: 'test' })
    ).rejects.toThrow('Duplicate content')
  })
})
```

### 12.2 Integration Tests

```typescript
describe('File Watcher Integration', () => {
  test('processes new file when added to directory', async () => {
    const testFile = 'data/job_postings/test/test-20250115.md'
    await fs.writeFile(testFile, MOCK_JOB_POSTING)
    
    await waitFor(() => {
      const record = db.query('SELECT * FROM job_postings WHERE file_path = $1', [testFile])
      expect(record.processing_status).toBe('completed')
    }, { timeout: 10000 })
  })
})
```

### 12.3 E2E Tests (Playwright)

```typescript
test('admin can upload job posting and see suggestions', async ({ page }) => {
  await page.goto('/admin/job-postings')
  await page.click('button:has-text("Upload New Posting")')
  
  await page.fill('input[name="brand_slug"]', 'tmobile')
  await page.fill('textarea[name="content"]', MOCK_JOB_POSTING)
  await page.click('button:has-text("Upload")')
  
  await expect(page.locator('.success-message')).toBeVisible()
  
  // Navigate to chat and verify suggestions
  await page.goto('/brand/tmobile')
  await page.waitForSelector('.suggested-questions')
  
  const suggestions = await page.locator('.suggested-questions li').allTextContents()
  expect(suggestions.length).toBeGreaterThan(0)
  expect(suggestions.some(s => s.includes('React'))).toBe(true)
})
```

---

## 13. Deployment Checklist

### 13.1 Pre-deployment

- [ ] Database migrations applied (`job_postings` table extensions)
- [ ] Environment variables configured:
  - [ ] `JOB_POSTINGS_DIR` - File system path
  - [ ] `JOB_POSTINGS_WATCHER_ENABLED` - Enable/disable watcher
  - [ ] `JOB_POSTINGS_CACHE_TTL` - Cache duration (default: 24h)
  - [ ] `JOB_POSTINGS_RETENTION_DAYS` - Retention policy (default: 90)
- [ ] File system permissions set (read/write access to `data/job_postings/`)
- [ ] LLM API keys configured and tested
- [ ] Rate limits configured in environment

### 13.2 Post-deployment

- [ ] Verify file watcher is running (check logs)
- [ ] Upload test job posting via admin API
- [ ] Verify processing completes successfully
- [ ] Check suggestions appear in chat interface
- [ ] Monitor error rates and processing times
- [ ] Set up alerts for processing failures

### 13.3 Rollback Plan

```typescript
// If issues arise, disable processing:
// 1. Set environment variable
process.env.JOB_POSTINGS_WATCHER_ENABLED = 'false'

// 2. Fallback to static suggestions
const fallbackSuggestions = await getSuggestedQueries(industry, brandSlug)

// 3. Database rollback script
// scripts/rollback_job_postings.sql
```

---

## 14. Future Enhancements

### 14.1 Phase 2 Features

- **Multi-language support**: Detect and process job postings in multiple languages
- **Automatic translation**: Translate suggestions to match user's language preference
- **Skill taxonomy**: Map extracted skills to standardized taxonomy (e.g., ESCO, O*NET)
- **Salary benchmarking**: Compare posted salary ranges with market data
- **Duplicate detection**: Identify similar postings across brands
- **Trend analysis**: Track skill demand trends over time

### 14.2 Advanced Analytics

- **Suggestion effectiveness**: Track which suggestions lead to meaningful conversations
- **A/B testing framework**: Test different suggestion generation strategies
- **Personalization**: Adapt suggestions based on user's profile and interaction history
- **Feedback loop**: Learn from user interactions to improve suggestion quality

### 14.3 Integration Opportunities

- **ATS integration**: Pull job postings directly from Applicant Tracking Systems
- **LinkedIn integration**: Scrape job postings from LinkedIn (with proper authorization)
- **Greenhouse/Lever API**: Sync job postings from popular ATS platforms
- **Webhook support**: Receive real-time updates when postings change

---

## 15. Success Metrics (Revisited)

### 15.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Processing success rate | ≥ 95% | `completed / (completed + failed)` |
| Avg processing time | ≤ 10s | P50 latency from file detection to DB insert |
| Cache hit rate | ≥ 70% | `cache_hits / total_requests` |
| Duplicate detection accuracy | ≥ 99% | Manual validation of content hashes |

### 15.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Suggestion relevance | ≥ 60% | A/B test: contextual vs generic suggestions |
| User engagement | +25% | Click-through rate on suggestions |
| Conversation depth | +30% | Avg turns per conversation |
| Time to first meaningful question | -40% | Time from chat open to first relevant question |

---

## Appendix A: Example Workflows

### Implementation Plans

- 🚀 **[Workflow 1: File Upload Processing →](./JOB_POSTING_INCREMENTAL_PLAN.md)** - ✅ COMPLETE (9 steps)
- 🚀 **[Workflow 3: Suggestion Generation →](./WORKFLOW_3_INCREMENTAL_PLAN.md)** - 📝 Ready (7 steps)
- 📋 **[Workflow 1 Validation Report →](./WORKFLOW_1_VALIDATION.md)** - ✅ Validated

### Workflow 1: New Job Posting via File Upload

```
1. Admin creates file: data/job_postings/tmobile/tmobile-20250115.md
2. File watcher detects new file
3. System reads file content
4. Content normalized (cleaning, encoding fix)
5. LLM extracts structured data (skills, requirements, etc.)
6. Embeddings generated for semantic search
7. Data stored in job_postings table
8. Cache invalidated for tmobile brand
9. Next chat session for tmobile uses new suggestions
```

### Workflow 2: Manual Upload via Admin API

📋 **[Full Architecture Specification →](./CAMPAIGN_CREATION_ARCHITECTURE.md)** - Complete campaign creation flow with Admin UI

**High-Level Flow:**
```
1. Admin navigates to /admin → "Campaigns" tab
2. Chooses input method:
   a. URL scraping (job board link)
   b. Text paste (markdown content)
   c. File upload (drag & drop .md/.pdf/.docx)
3. Fills campaign metadata:
   - Brand slug (manual or auto-extracted)
   - Industry (existing or create new)
   - Campaign slug (auto-generated or override)
   - Visual settings (accent color, CTA variant)
4. Submits form → POST /api/admin/campaigns/create
5. Real-time processing status display:
   ✓ Content fetched/parsed
   ✓ Job posting processed (LLM + embeddings)
   ✓ Campaign MDX generated
   ✓ Index updated
   ✓ Cache invalidated
6. Campaign goes live immediately
7. Suggestions available in next chat session
```

**Key Features:**
- **URL Scraping**: Automatic content extraction from job boards
- **New Industry Creation**: Full scaffolding (DB migration, templates, type updates)
- **Preview Mode**: QA before going live
- **Campaign Management**: List, edit, archive campaigns

**See [Campaign Creation Architecture](./CAMPAIGN_CREATION_ARCHITECTURE.md) for:**
- Detailed API specifications
- Admin UI mockups
- Security considerations
- Implementation plan (4-week roadmap)

### Workflow 3: Suggestion Generation in Chat

```
1. User opens chat for brand "tmobile"
2. Client requests suggestions: GET /api/suggestions/campaign?brandSlug=tmobile
3. Server checks cache (key: suggestions:tmobile:hash)
4. Cache miss → fetch job_postings for tmobile
5. Generate contextual suggestions using LLM
6. Store in cache (TTL: 24h)
7. Return suggestions to client
8. User sees 5 contextual questions
9. User clicks suggestion → RAG query with context
```

---

## Appendix B: Configuration Reference

```typescript
// config/job_postings.ts
export const JOB_POSTINGS_CONFIG = {
  // File system
  data_dir: process.env.JOB_POSTINGS_DIR || 'data/job_postings',
  supported_formats: ['md', 'txt', 'json'],
  max_file_size_mb: 5,
  
  // Processing
  watcher_enabled: process.env.JOB_POSTINGS_WATCHER_ENABLED === 'true',
  processing_concurrency: 3,
  max_retries: 3,
  retry_delay_ms: 5000,
  
  // Content
  max_tokens: 4000,
  section_token_limits: {
    description: 1000,
    requirements: 800,
    responsibilities: 800,
    nice_to_have: 400,
    benefits: 400,
    company: 600,
  },
  
  // Cache
  cache_ttl_hours: 24,
  cache_enabled: true,
  
  // Retention
  retention_days: 90,
  cleanup_cron: '0 2 * * *', // Daily at 2 AM UTC
  
  // LLM
  llm_model: 'gpt-4o-mini',
  llm_timeout_ms: 30000,
  llm_max_tokens: 2000,
  
  // Rate limits
  rate_limits: {
    uploads_per_brand_per_hour: 10,
    processing_triggers_per_hour: 5,
    llm_calls_per_hour: 100,
  },
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-29  
**Owner**: Engineering Team  
**Status**: Draft - Pending Review
