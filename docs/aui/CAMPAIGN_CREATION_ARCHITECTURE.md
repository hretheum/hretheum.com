# Campaign Creation Architecture & Admin UI Specification

**Status**: Implementation Phase (Phase 1: Backend Foundation - 3/8 tasks complete)  
**Related**: [Job Posting Intelligence Spec](./JOB_POSTING_INTELLIGENCE_SPEC.md), [Living Layouts Implementation](./LIVING_LAYOUTS_IMPLEMENTATION.md)  
**Target**: Workflow 2 (Manual Upload via Admin API) + Full Campaign Scaffolding

---

## 1. Current State Analysis

### 1.1 Existing Campaign Structure

**File System Layout:**
```
data/
├── campaigns/
│   ├── index.json                    # Brand slug → campaign file mapping
│   ├── tmobile_g2m_lead.mdx          # Campaign MDX with frontmatter
│   ├── blix_team_lead.mdx
│   └── ...
└── job_postings/
    ├── tmobile/
    │   └── tmobile-20250929T224212Z.md
    └── ...
```

**Campaign MDX Frontmatter Schema:**
```yaml
---
slug: tmobile_g2m_lead
brand: tmobile
industry: Telecom
accent: "#e20074"
ctaVariant: filled
role: Go2Market, UX & UI Lead
location: Warsaw, Mokotów (Hybrid)
contract: B2B, full-time
period: "2025-09-09 – 2025-10-09"
hero_headline: "TELECOM & e‑commerce HIRING SIGNALS"
ctas:
  - label: "Spotkajmy się"
    variant: primary
  - label: "Porozmawiaj z moim AI"
    href: "https://hretheum.com"
    variant: secondary
sections:
  - type: meta
  - type: metrics
  - type: playbook
  - type: timeline
  - type: closing_cta
metrics:
  - label: "Rynki"
    value: "10+"
case_grid:
  items:
    - title: "Ścieżki konwersji e‑shopu"
      subtitle: "T‑Mobile"
      outcome: "Wyższa konwersja"
---
```

### 1.2 Industry Resolution Flow

**Current Process** (`lib/industry_server.ts`):
1. **Deterministic mapping** - hardcoded in `lib/industry.ts`
2. **DB lookup** - `brand_industries` table (Supabase)
3. **LLM classification** - runtime with autopromote (confidence threshold)
4. **Generic fallback** - if all above fail

**Supabase Tables:**
- `brand_industries` - locked/manual/auto industry assignments
- `brand_industry_suggestions` - LLM suggestions (72h TTL)
- `industry_resolution_events` - audit log

**Allowed Industries** (from `lib/industry.ts`):
```typescript
type Industry = 
  | 'Fintech' | 'InsurTech' | 'Telecom' | 'SaaS' 
  | 'E-commerce' | 'Gaming' | 'HealthTech' | 'EdTech'
  | 'Generic' | 'Dummy'
```

### 1.3 Job Posting Processing Pipeline

**Workflow 1** (File Watcher - Implemented):
```
File Upload → Watcher → Normalize → LLM Extract → Embeddings → DB Store → Cache Invalidate
```

**Key Components:**
- `scripts/job_posting_watcher.ts` - File system watcher
- `lib/job_postings/` - Processing modules (reader, normalizer, extractor, embeddings, storage)
- `job_postings` table (Supabase) - Structured storage with pgvector

---

## 2. Proposed Architecture

### 2.1 Admin UI - New Tab: "Campaigns"

**Location**: `/admin` → New tab "Campaigns" (alongside Events, Redirects, RUM, Industry, Requests)

**UI Components:**

#### 2.1.1 Campaign Creation Form

**Three Input Methods:**

1. **URL Scraping** (Primary)
   ```
   [Input: Job Posting URL]
   ├─ Fetch HTML content
   ├─ Extract text (readability/cheerio)
   ├─ Normalize & clean
   └─ Auto-populate form fields
   ```

2. **Manual Text Input** (Alternative A)
   ```
   [Textarea: Paste job posting content]
   ├─ Direct text input
   ├─ Markdown support
   └─ Preview pane
   ```

3. **File Upload** (Alternative B)
   ```
   [Drag & Drop / File Picker]
   ├─ Accept: .md, .txt, .pdf, .docx
   ├─ Parse content
   └─ Populate form
   ```

**Form Fields:**

```typescript
interface CampaignCreationForm {
  // Source
  source: {
    type: 'url' | 'text' | 'file'
    url?: string
    content?: string
    file?: File
  }
  
  // Brand & Industry
  brandSlug: string              // Manual input or auto-extracted
  industry: Industry             // Dropdown (existing) or "Create New"
  newIndustry?: string           // If "Create New" selected
  
  // Campaign Metadata
  campaignSlug: string           // Auto-generated or manual override
  role: string                   // Extracted from job posting
  location?: string
  contract?: string
  period?: string
  
  // Visual
  accent?: string                // Color picker (hex)
  ctaVariant?: 'filled' | 'outline'
  heroHeadline?: string
  
  // Advanced (collapsible)
  customCtas?: CTA[]
  customMetrics?: Metric[]
  customSections?: Section[]
}
```

#### 2.1.2 Processing Flow Visualization

**Real-time Status Display:**
```
┌─────────────────────────────────────┐
│ Processing Campaign...              │
├─────────────────────────────────────┤
│ ✓ Content fetched                   │
│ ✓ Text normalized                   │
│ ⏳ LLM extraction (skills, reqs)    │
│ ⏳ Embeddings generation             │
│ ⏳ Database storage                  │
│ ⏳ Campaign file creation            │
│ ⏳ Index update                      │
│ ⏳ Cache invalidation                │
└─────────────────────────────────────┘
```

#### 2.1.3 Campaign List View

**Table Columns:**
- Brand Slug
- Industry
- Campaign Slug
- Created At
- Status (Active/Draft/Archived)
- Actions (Edit, Delete, Preview)

**Filters:**
- Industry
- Status
- Date Range

---

### 2.2 Backend API Architecture

#### 2.2.1 New API Endpoint: `/api/admin/campaigns`

**POST /api/admin/campaigns/create**

```typescript
interface CreateCampaignRequest {
  source: {
    type: 'url' | 'text' | 'file'
    url?: string
    content?: string
    fileData?: string  // base64 for file upload
  }
  brandSlug: string
  industry: Industry | 'new'
  newIndustry?: string
  campaignSlug?: string  // optional override
  metadata: {
    role?: string
    location?: string
    contract?: string
    period?: string
    accent?: string
    ctaVariant?: 'filled' | 'outline'
    heroHeadline?: string
  }
  advanced?: {
    ctas?: CTA[]
    metrics?: Metric[]
    sections?: Section[]
  }
}

interface CreateCampaignResponse {
  success: boolean
  campaignId: string
  brandSlug: string
  campaignSlug: string
  jobPostingId?: string
  steps: ProcessingStep[]
  errors?: string[]
}

interface ProcessingStep {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  duration?: number
  error?: string
}
```

**Processing Pipeline:**

```typescript
async function createCampaign(req: CreateCampaignRequest): Promise<CreateCampaignResponse> {
  const steps: ProcessingStep[] = []
  
  // Step 1: Content Acquisition
  steps.push({ name: 'content_fetch', status: 'running' })
  const content = await fetchContent(req.source)
  steps[0].status = 'completed'
  
  // Step 2: Industry Setup (if new)
  if (req.industry === 'new' && req.newIndustry) {
    steps.push({ name: 'industry_creation', status: 'running' })
    await createNewIndustry(req.newIndustry)
    steps[1].status = 'completed'
  }
  
  // Step 3: Job Posting Processing
  steps.push({ name: 'job_posting_processing', status: 'running' })
  const jobPostingId = await processJobPosting({
    brandSlug: req.brandSlug,
    content,
    timestamp: new Date().toISOString()
  })
  steps[2].status = 'completed'
  
  // Step 4: Campaign File Generation
  steps.push({ name: 'campaign_file_generation', status: 'running' })
  const campaignSlug = req.campaignSlug || generateCampaignSlug(req.brandSlug, req.metadata.role)
  await generateCampaignMDX({
    slug: campaignSlug,
    brand: req.brandSlug,
    industry: req.industry === 'new' ? req.newIndustry! : req.industry,
    ...req.metadata,
    ...req.advanced
  })
  steps[3].status = 'completed'
  
  // Step 5: Index Update
  steps.push({ name: 'index_update', status: 'running' })
  await updateCampaignIndex(req.brandSlug, campaignSlug)
  steps[4].status = 'completed'
  
  // Step 6: Cache Invalidation
  steps.push({ name: 'cache_invalidation', status: 'running' })
  await invalidateCache(req.brandSlug)
  steps[5].status = 'completed'
  
  return {
    success: true,
    campaignId: generateId(),
    brandSlug: req.brandSlug,
    campaignSlug,
    jobPostingId,
    steps
  }
}
```

#### 2.2.2 Supporting Endpoints

**GET /api/admin/campaigns**
- List all campaigns
- Filters: industry, status, dateRange
- Pagination

**GET /api/admin/campaigns/:slug**
- Get campaign details
- Include job posting data
- Include metrics (views, conversions)

**PUT /api/admin/campaigns/:slug**
- Update campaign metadata
- Regenerate MDX file
- Update index

**DELETE /api/admin/campaigns/:slug**
- Archive campaign (soft delete)
- Remove from index
- Keep job posting data

**POST /api/admin/campaigns/:slug/preview**
- Generate preview URL
- Temporary deployment
- QA before going live

---

### 2.3 New Industry Creation Flow

**When `industry === 'new'`:**

#### 2.3.1 Database Migration

**New Table: `industries`**
```sql
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  accent_color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Add to existing allowed_industries enum
ALTER TYPE industry ADD VALUE 'NewIndustryName';
```

#### 2.3.2 Template Generation

**Auto-generate campaign templates:**

```typescript
async function createNewIndustry(name: string) {
  const slug = slugify(name)
  
  // 1. Database entry
  await supabase.from('industries').insert({
    name,
    slug,
    description: `${name} industry campaigns`,
    status: 'active'
  })
  
  // 2. Add to brand_industries mapping
  await supabase.from('brand_industries').insert({
    brand_slug: slug,
    industry: name,
    status: 'manual',
    updated_by: 'admin'
  })
  
  // 3. Create default templates
  await createIndustryTemplates(slug, name)
  
  // 4. Update TypeScript types (requires rebuild)
  await updateIndustryTypes(name)
  
  return { slug, name }
}
```

**Template Files Created:**
```
data/
├── campaigns/
│   └── templates/
│       └── {industry_slug}/
│           ├── default.mdx
│           ├── senior.mdx
│           └── lead.mdx
└── industries/
    └── {industry_slug}.json  # Industry metadata
```

#### 2.3.3 Type System Update

**Challenge**: TypeScript `Industry` type is compile-time

**Solutions:**

**Option A: Runtime Validation (Recommended)**
```typescript
// lib/industry.ts
const ALLOWED_INDUSTRIES = new Set<string>([
  'Fintech', 'InsurTech', 'Telecom', 'SaaS',
  'E-commerce', 'Gaming', 'HealthTech', 'EdTech',
  'Generic', 'Dummy'
])

// Fetch from DB at runtime
async function getAllowedIndustries(): Promise<Set<string>> {
  const { data } = await supabase.from('industries').select('name')
  return new Set([...ALLOWED_INDUSTRIES, ...data.map(d => d.name)])
}

export type Industry = string  // Relaxed to allow dynamic industries
```

**Option B: Code Generation (Build-time)**
```typescript
// scripts/generate-industry-types.ts
async function generateIndustryTypes() {
  const { data } = await supabase.from('industries').select('name')
  const types = data.map(d => `'${d.name}'`).join(' | ')
  
  const code = `
// Auto-generated - do not edit manually
export type Industry = ${types}
  `
  
  await fs.writeFile('lib/industry-types.generated.ts', code)
}
```

**Recommendation**: Use **Option A** for flexibility + add admin warning that app rebuild may be needed for full type safety.

---

### 2.4 Content Scraping Module

**New Module: `lib/scraping/`**

```typescript
// lib/scraping/url-fetcher.ts
export async function fetchJobPostingFromUrl(url: string): Promise<string> {
  // Use readability or cheerio to extract main content
  const response = await fetch(url)
  const html = await response.text()
  
  // Extract text content
  const $ = cheerio.load(html)
  
  // Common job posting selectors
  const selectors = [
    '.job-description',
    '[data-testid="job-description"]',
    'article',
    'main',
    '.content'
  ]
  
  let content = ''
  for (const selector of selectors) {
    const text = $(selector).text()
    if (text.length > 200) {
      content = text
      break
    }
  }
  
  if (!content) {
    // Fallback: extract all text
    content = $('body').text()
  }
  
  return normalizeContent(content)
}

// lib/scraping/file-parser.ts
export async function parseJobPostingFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'md':
    case 'txt':
      return await file.text()
    
    case 'pdf':
      return await parsePDF(file)
    
    case 'docx':
      return await parseDOCX(file)
    
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}
```

---

### 2.5 Campaign File Generator

**New Module: `lib/campaigns/generator.ts`**

```typescript
interface CampaignTemplate {
  slug: string
  brand: string
  industry: string
  accent?: string
  ctaVariant?: 'filled' | 'outline'
  role?: string
  location?: string
  contract?: string
  period?: string
  heroHeadline?: string
  ctas?: CTA[]
  sections?: Section[]
  metrics?: Metric[]
  caseGrid?: CaseGrid
}

export async function generateCampaignMDX(template: CampaignTemplate): Promise<string> {
  const frontmatter = yaml.stringify({
    slug: template.slug,
    brand: template.brand,
    industry: template.industry,
    accent: template.accent || generateAccentColor(template.industry),
    ctaVariant: template.ctaVariant || 'filled',
    role: template.role,
    location: template.location,
    contract: template.contract,
    period: template.period,
    hero_headline: template.heroHeadline || generateDefaultHeadline(template.industry, template.role),
    ctas: template.ctas || generateDefaultCTAs(),
    sections: template.sections || generateDefaultSections(),
    metrics: template.metrics || [],
    case_grid: template.caseGrid || { items: [] }
  })
  
  const body = generateCampaignBody(template)
  
  const mdx = `---\n${frontmatter}---\n\n${body}`
  
  // Write to file
  const filePath = path.join(process.cwd(), 'data', 'campaigns', `${template.slug}.mdx`)
  await fs.writeFile(filePath, mdx, 'utf-8')
  
  return mdx
}

function generateDefaultSections(): Section[] {
  return [
    { type: 'meta' },
    { type: 'metrics' },
    { type: 'playbook' },
    { type: 'timeline' },
    { type: 'closing_cta' }
  ]
}

function generateDefaultCTAs(): CTA[] {
  return [
    { label: 'Spotkajmy się', variant: 'primary' },
    { label: 'Porozmawiaj z moim AI', href: 'https://hretheum.com', variant: 'secondary' }
  ]
}

function generateAccentColor(industry: string): string {
  const colors: Record<string, string> = {
    'Fintech': '#10b981',
    'InsurTech': '#3b82f6',
    'Telecom': '#e20074',
    'SaaS': '#8b5cf6',
    'E-commerce': '#f59e0b',
    'Gaming': '#ef4444',
    'HealthTech': '#06b6d4',
    'EdTech': '#6366f1',
    'Generic': '#6b7280'
  }
  return colors[industry] || '#7c3aed'
}
```

---

### 2.6 Index Management

**Update: `data/campaigns/index.json`**

```typescript
// lib/campaigns/index-manager.ts
export async function updateCampaignIndex(brandSlug: string, campaignSlug: string) {
  const indexPath = path.join(process.cwd(), 'data', 'campaigns', 'index.json')
  const index = JSON.parse(await fs.readFile(indexPath, 'utf-8'))
  
  index[brandSlug] = { slug: campaignSlug }
  
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
}

export async function removeCampaignFromIndex(brandSlug: string) {
  const indexPath = path.join(process.cwd(), 'data', 'campaigns', 'index.json')
  const index = JSON.parse(await fs.readFile(indexPath, 'utf-8'))
  
  delete index[brandSlug]
  
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
}
```

---

## 3. Implementation Plan

### Phase 1: Backend Foundation (Week 1)

#### ✅ Task 1.1: Create `/api/admin/campaigns/create` endpoint 

**Definition of Done:**
- POST endpoint accepts all 3 input types (URL, text, file)
- Request validation with Zod schema
- Response includes processing steps with status
- Error handling with specific error codes
- Admin-only access enforced (ADMIN_EMAILS check)
- API documented in OpenAPI/Swagger format

**Guardrails:**
- Request timeout: 60s max
- File size limit: 5MB
- Rate limiting: 10 requests/minute per admin
- Input sanitization (XSS prevention)
- CORS headers for admin origin only

**Quality Gates:**
- All request validation tests pass (invalid inputs rejected)
- Response schema matches TypeScript interface
- Error responses include actionable messages
- API latency p95 < 2s (excluding LLM processing)

**Success Metrics:**
- 100% of valid requests return 200/201
- 0% false positives in validation
- Error rate < 1%
- Average response time < 5s

**Tests:**
- Unit: Request validation (10 test cases)
- Unit: Error handling (5 scenarios)
- Integration: Full flow with mocked dependencies
- E2E: Create campaign from URL, text, file

---

#### ✅ Task 1.2: Implement content scraping module (`lib/scraping/`) 

**Definition of Done:**
- `fetchJobPostingFromUrl()` extracts text from job board URLs
- `parseJobPostingFile()` supports .md, .txt, .pdf, .docx
- Content normalization (encoding, whitespace, special chars)
- Readability/Cheerio integration for HTML parsing
- PDF/DOCX parsing with fallback to plain text
- Error handling for network failures, timeouts, invalid formats

**Guardrails:**
- Domain whitelist (pracuj.pl, nofluffjobs.com, justjoin.it, etc.)
- Timeout: 10s per URL fetch
- Max content length: 50,000 chars
- Retry logic: 3 attempts with exponential backoff
- User-Agent spoofing prevention

**Quality Gates:**
- Successfully extracts content from 95% of whitelisted domains
- Handles malformed HTML gracefully (no crashes)
- PDF/DOCX parsing accuracy > 90%
- No SSRF vulnerabilities (security audit pass)

**Success Metrics:**
- Content extraction success rate ≥ 95%
- Average extraction time < 3s
- Zero SSRF incidents
- Parsing accuracy (manual validation on 20 samples) > 90%

**Tests:**
- Unit: URL validation (whitelist/blacklist)
- Unit: HTML parsing (5 job board samples)
- Unit: File parsing (.md, .txt, .pdf, .docx)
- Integration: End-to-end scraping with real URLs (mocked responses)
- Security: SSRF attack vectors (10 malicious URLs)

---

#### ✅ Task 1.3: Implement campaign file generator (`lib/campaigns/generator.ts`)

**Definition of Done:**
- `generateCampaignMDX()` creates valid MDX files
- Frontmatter schema matches existing campaigns
- Default values for optional fields (accent, CTAs, sections)
- Template inheritance (industry-specific defaults)
- File written to `data/campaigns/{slug}.mdx`
- Atomic file writes (temp file + rename)

**Guardrails:**
- Slug validation (alphanumeric + hyphens only)
- Accent color validation (hex format)
- CTA URL validation (HTTPS only)
- Max file size: 100KB
- Backup existing file before overwrite

**Quality Gates:**
- Generated MDX passes MDX compiler validation
- Frontmatter schema validation (Zod)
- All required fields present
- No duplicate slugs in index.json
- File permissions correct (644)

**Success Metrics:**
- 100% of generated files are valid MDX
- Zero file write failures
- Schema validation pass rate: 100%
- Average generation time < 100ms

**Tests:**
- Unit: Frontmatter generation (all field combinations)
- Unit: Default value population
- Unit: Slug generation and validation
- Integration: Full MDX generation + compilation
- E2E: Generate campaign, verify file exists and is valid

---

#### Task 1.4: AI-Powered Campaign Content Generation

**Definition of Done:**
- LLM analyzes job posting content + requirements
- RAG retrieval of relevant competencies from vector DB
- RAG retrieval of relevant portfolio items (case studies)
- AI generates campaign narrative recommendations
- AI generates copy for campaign modules (hero, sections, metrics)
- Case study prioritization based on job posting match (vector similarity)
- Output structured for campaign generator (Task 1.3)
- Confidence scores for each recommendation

**Guardrails:**
- LLM timeout: 30s max per generation request
- Max job posting length: 10,000 tokens
- RAG context window: 8,000 tokens max
- Case study limit: top 10 most relevant
- Fallback to generic templates on LLM failure
- Content safety check (no hallucinated claims)
- Human review flag for low confidence (< 0.7)

**Quality Gates:**
- Generated copy passes MDX validation
- All recommendations have confidence scores
- Case study matches are semantically relevant (cosine similarity > 0.6)
- Generated metrics are factual (pulled from actual portfolio)
- No fabricated project names or outcomes
- Copy length within limits (hero < 200 chars, sections < 1000 chars)

**Success Metrics:**
- Content generation success rate > 95%
- Average generation time < 15s
- Case study relevance score (manual review) > 0.8
- Copy quality score (manual review) > 4/5
- LLM API cost per campaign < $0.50

**Tests:**
- Unit: Job posting analysis (5 samples)
- Unit: RAG retrieval accuracy (competencies + portfolio)
- Unit: Case study ranking algorithm
- Integration: Full flow (job posting → AI generation → MDX output)
- E2E: Generate campaign from real job posting, verify quality

**Implementation Details:**

```typescript
interface AIGenerationInput {
  jobPosting: {
    content: string
    requirements: string[]
    skills: string[]
    role: string
    seniority: string
  }
  brand: string
  industry: string
}

interface AIGenerationOutput {
  narrative: {
    positioning: string // How to position for this role
    keyMessages: string[] // 3-5 key messages to emphasize
    tone: 'technical' | 'leadership' | 'strategic'
    confidence: number
  }
  copy: {
    heroHeadline: string
    heroSubtitle?: string
    sections: Array<{
      type: string
      title: string
      content: string
    }>
    confidence: number
  }
  caseStudies: Array<{
    id: string
    title: string
    relevanceScore: number // 0-1
    matchedSkills: string[]
    matchedContext: string
  }>
  metrics: Array<{
    label: string
    value: string
    source: string // Where this metric comes from
  }>
}
```

**RAG Integration:**
- Query vector DB with job requirements
- Retrieve top-k competencies (k=10)
- Retrieve top-k portfolio items (k=15)
- Use MMR (Maximal Marginal Relevance) for diversity
- Include metadata: project outcomes, technologies, impact

**LLM Prompt Strategy:**
```
System: You are an expert career strategist helping create a personalized campaign.
Context: [Job posting requirements + RAG-retrieved competencies + case studies]
Task: Generate campaign narrative and copy that:
1. Highlights relevant experience from actual portfolio
2. Positions candidate strengths for this specific role
3. Suggests most relevant case studies to showcase
4. Creates compelling but factual copy

Constraints:
- Only reference actual projects from provided portfolio
- No fabricated metrics or outcomes
- Maintain professional tone
- Focus on measurable impact
```

**Performance Optimization:**
- Cache LLM responses for identical job postings (24h TTL)
- Parallel RAG queries (competencies + portfolio)
- Stream LLM output for faster UX
- Precompute case study embeddings

---

#### Task 1.5: Implement index manager (`lib/campaigns/index-manager.ts`)

**Definition of Done:**
- `updateCampaignIndex()` adds/updates brand → campaign mapping
- `removeCampaignFromIndex()` removes mapping
- Atomic updates (read → modify → write with lock)
- Backup index.json before modification
- Validation of index.json structure after update

**Guardrails:**
- File locking mechanism (prevent concurrent writes)
- Backup retention: last 10 versions
- Index validation after each update
- Rollback on validation failure
- Max index size: 1MB

**Quality Gates:**
- Index.json remains valid JSON after all operations
- No duplicate brand slugs
- All referenced campaign files exist
- Atomic operations (no partial updates)

**Success Metrics:**
- 100% of updates succeed or rollback cleanly
- Zero index corruption incidents
- Average update time < 50ms
- Concurrent update handling: 100% success rate

**Tests:**
- Unit: Add/update/remove operations
- Unit: Concurrent update handling (race conditions)
- Unit: Rollback on failure
- Integration: Full workflow with file system
- E2E: Multiple campaigns created in parallel

---

#### Task 1.6: Add new industry creation flow

**Definition of Done:**
- `createNewIndustry()` creates DB entry + templates
- Industry slug generation (kebab-case)
- Default accent color assignment
- Template files created in `data/campaigns/templates/{slug}/`
- TypeScript type update (runtime validation)
- Audit log entry created

**Guardrails:**
- Industry name validation (alphanumeric + spaces, 3-50 chars)
- Duplicate check (name and slug)
- Admin-only operation
- Rollback on any step failure
- Rate limiting: 5 new industries per day

**Quality Gates:**
- Industry appears in `getAllowedIndustries()` immediately
- Templates are valid MDX
- Database constraints enforced (unique slug)
- No orphaned records on failure

**Success Metrics:**
- 100% of valid industry creations succeed
- Zero orphaned templates
- Average creation time < 2s
- Type system updated within 1 minute

**Tests:**
- Unit: Slug generation (special chars, duplicates)
- Unit: Template generation
- Integration: Full flow (DB + filesystem + types)
- E2E: Create industry, use in campaign creation
- Security: SQL injection attempts

---

#### Task 1.7: Database migrations for `industries` table

**Definition of Done:**
- Migration script creates `industries` table
- All columns with correct types and constraints
- Indexes on `slug` and `name`
- RLS policies for admin-only access
- Rollback script tested
- Migration applied to dev, staging, prod

**Guardrails:**
- Migration is idempotent (safe to re-run)
- Backup before migration
- Rollback tested on staging
- Zero downtime deployment
- Data validation after migration

**Quality Gates:**
- All constraints enforced (unique, not null)
- RLS policies prevent unauthorized access
- Indexes improve query performance (< 10ms)
- Migration completes in < 5s

**Success Metrics:**
- Migration success rate: 100%
- Zero data loss
- Query performance: < 10ms for industry lookup
- RLS policy effectiveness: 100% (unauthorized access blocked)

**Tests:**
- Unit: Migration SQL syntax validation
- Integration: Apply + rollback on test DB
- E2E: Full workflow after migration
- Security: RLS policy bypass attempts

---

#### Task 1.8: Unit tests consolidation for all modules

**Definition of Done:**
- Test coverage ≥ 80% for all new modules
- All edge cases covered (invalid inputs, errors, timeouts)
- Mocks for external dependencies (LLM, file system, DB)
- Fast tests (< 100ms per test)
- CI/CD integration (tests run on every commit)

**Guardrails:**
- No flaky tests (deterministic results)
- Isolated tests (no shared state)
- Clear test names (describe behavior, not implementation)
- Fail fast on first error

**Quality Gates:**
- All tests pass on CI
- Coverage report generated
- No skipped or pending tests
- Test execution time < 30s total

**Success Metrics:**
- Code coverage: ≥ 80%
- Test pass rate: 100%
- Average test execution time: < 50ms
- Zero flaky tests

**Tests:**
- 50+ unit tests across all modules
- Coverage: scraping (15), generator (20), index (10), industry (15)

---

### Phase 2: Admin UI (Week 2)

#### Task 2.1: Create "Campaigns" tab in `/admin`

**Definition of Done:**
- New tab appears in AdminTabs component
- Tab routing works (`/admin?tab=campaigns`)
- Tab content area with placeholder
- Consistent styling with existing tabs
- Mobile responsive
- Loading states

**Guardrails:**
- Admin-only access (inherited from parent)
- Tab state persisted in URL
- Graceful degradation on JS disabled
- Accessibility (ARIA labels, keyboard navigation)

**Quality Gates:**
- Tab switching works without page reload
- URL updates on tab change
- Back button works correctly
- No layout shift on tab switch

**Success Metrics:**
- Tab switch time: < 100ms
- Accessibility score: 100 (Lighthouse)
- Mobile usability: no horizontal scroll
- Zero console errors

**Tests:**
- Unit: Tab component rendering
- Integration: Tab switching logic
- E2E: Navigate to campaigns tab, verify content
- Accessibility: Keyboard navigation, screen reader

---

#### Task 2.2: Build campaign creation form (3 input methods)

**Definition of Done:**
- Form with 3 tabs: URL, Text, File
- All fields from `CampaignCreationForm` interface
- Industry dropdown (existing + "Create New" option)
- Color picker for accent
- Form validation (client-side + server-side)
- Submit button with loading state
- Error display (field-level + form-level)

**Guardrails:**
- Client-side validation before submit
- Debounced input (prevent excessive API calls)
- File upload progress indicator
- Max file size enforced (5MB)
- Unsaved changes warning

**Quality Gates:**
- All validation rules enforced
- Error messages are actionable
- Form state persists on tab switch
- No data loss on network error

**Success Metrics:**
- Form completion rate: > 80%
- Validation error rate: < 10%
- Average form fill time: < 2 minutes
- User satisfaction: > 4/5

**Tests:**
- Unit: Form validation logic (20 test cases)
- Unit: Input method switching
- Integration: Form submission with mocked API
- E2E: Fill form, submit, verify campaign created
- Accessibility: Form labels, error announcements

---

#### Task 2.3: Add real-time processing status display

**Definition of Done:**
- Status component shows 8 processing steps
- Real-time updates via polling or WebSocket
- Progress bar (0-100%)
- Step-level status (pending, running, completed, failed)
- Error details for failed steps
- Completion notification

**Guardrails:**
- Polling interval: 500ms (not too aggressive)
- Timeout: 60s max
- Graceful degradation (fallback to final status)
- Cancel operation button

**Quality Gates:**
- Status updates within 1s of backend change
- No UI freezing during updates
- Error states clearly communicated
- Smooth animations (no jank)

**Success Metrics:**
- Status accuracy: 100%
- Update latency: < 1s
- User comprehension: > 90% (user testing)
- Perceived performance: "fast" rating > 80%

**Tests:**
- Unit: Status component rendering (all states)
- Integration: Polling logic with mocked API
- E2E: Full workflow, verify status updates
- Performance: No memory leaks during long polling

---

#### Task 2.4: Implement campaign list view with filters

**Definition of Done:**
- Table with columns: Brand, Industry, Campaign, Created, Status, Actions
- Filters: Industry, Status, Date Range
- Sorting by any column
- Pagination (20 items per page)
- Search by brand slug
- Bulk actions (archive, delete)

**Guardrails:**
- Client-side filtering for < 100 items
- Server-side filtering for > 100 items
- Debounced search (300ms)
- Optimistic UI updates
- Undo for destructive actions

**Quality Gates:**
- Filter response time: < 200ms
- No layout shift on filter change
- Pagination works correctly
- Sort order persists on page reload

**Success Metrics:**
- Filter usage rate: > 50%
- Average time to find campaign: < 10s
- Zero data inconsistencies
- User satisfaction: > 4/5

**Tests:**
- Unit: Filter logic (10 combinations)
- Unit: Sorting logic
- Integration: API integration with filters
- E2E: Apply filters, verify results
- Performance: Large dataset (1000 campaigns)

---

#### Task 2.5: Add preview functionality

**Definition of Done:**
- Preview button in campaign list
- Opens campaign in new tab with `?preview=true`
- Preview banner at top (not indexed, not cached)
- Edit link back to admin
- Preview expires after 24h

**Guardrails:**
- Preview URLs not crawlable (noindex, nofollow)
- Preview data not cached in CDN
- Preview access logged (audit trail)
- Preview auto-expires

**Quality Gates:**
- Preview renders identically to live
- No SEO impact (verified with Google Search Console)
- Preview loads in < 3s
- Edit link works correctly

**Success Metrics:**
- Preview usage rate: > 70% before publish
- Preview accuracy: 100% (matches live)
- Zero SEO incidents
- Average preview time: 30s

**Tests:**
- Unit: Preview URL generation
- Integration: Preview rendering with preview flag
- E2E: Create campaign, preview, verify banner
- SEO: Verify noindex, nofollow, no sitemap

---

#### Task 2.6: E2E tests with Playwright

**Definition of Done:**
- 10+ E2E scenarios covering full workflow
- Tests run on CI (GitHub Actions)
- Screenshots on failure
- Video recording for debugging
- Parallel execution (4 workers)
- Flake detection and retry

**Guardrails:**
- Tests use isolated test data (no prod data)
- Cleanup after each test
- Deterministic results (no random data)
- Fast execution (< 5 minutes total)

**Quality Gates:**
- All E2E tests pass on CI
- Zero flaky tests (3 consecutive runs)
- Test coverage: all critical paths
- Execution time: < 5 minutes

**Success Metrics:**
- E2E pass rate: 100%
- Flake rate: 0%
- Bug detection rate: > 80% (catch bugs before prod)
- Average execution time: < 3 minutes

**Tests:**
- E2E: Create campaign from URL (happy path)
- E2E: Create campaign with new industry
- E2E: Form validation errors
- E2E: File upload (all formats)
- E2E: Preview and publish
- E2E: Edit existing campaign
- E2E: Archive campaign
- E2E: Filter and search
- E2E: Concurrent campaign creation
- E2E: Error recovery (network failure)

---

### Phase 3: Integration & Testing (Week 3)

#### Task 3.1: Integrate with existing job posting pipeline

**Definition of Done:**
- Campaign creation triggers job posting processing (Workflow 1)
- Job posting ID linked to campaign in DB
- Cache invalidation works end-to-end
- Suggestions reflect new campaign immediately
- No duplicate processing

**Guardrails:**
- Idempotent operations (safe to retry)
- Transaction boundaries (all-or-nothing)
- Rollback on any step failure
- Monitoring for pipeline failures

**Quality Gates:**
- Integration points tested with real data
- No data inconsistencies
- Cache invalidation verified (suggestions update)
- Performance: no degradation to existing pipeline

**Success Metrics:**
- Integration success rate: 100%
- End-to-end latency: < 30s
- Zero data loss
- Suggestion freshness: < 1 minute

**Tests:**
- Integration: Full workflow (campaign → job posting → suggestions)
- Integration: Rollback scenarios
- E2E: Create campaign, verify suggestions in chat
- Performance: Concurrent campaign creation (10 simultaneous)

---

#### Task 3.2: Test full workflow (URL → Campaign → Live)

**Definition of Done:**
- 20+ real-world scenarios tested
- All input methods (URL, text, file) tested
- All industries tested
- Error scenarios tested (invalid URL, timeout, etc.)
- Performance benchmarks documented

**Guardrails:**
- Test data isolated from production
- Cleanup after tests
- No side effects (idempotent)
- Reproducible results

**Quality Gates:**
- All scenarios pass
- Performance meets SLAs (< 30s end-to-end)
- Error handling verified
- User experience validated (manual testing)

**Success Metrics:**
- Scenario pass rate: 100%
- Average workflow time: < 20s
- Error recovery rate: 100%
- User satisfaction: > 4.5/5

**Tests:**
- 20+ E2E scenarios (various inputs, industries, edge cases)
- Performance benchmarks (P50, P95, P99)
- Error injection tests (network failures, timeouts)

---

#### Task 3.3: Performance testing (large job postings)

**Definition of Done:**
- Load testing with 100+ concurrent requests
- Stress testing (find breaking point)
- Large file handling (5MB PDFs)
- Long content (50,000 chars)
- Performance report with bottlenecks identified

**Guardrails:**
- Testing on staging (not production)
- Rate limiting enforced
- Resource monitoring (CPU, memory, DB connections)
- Graceful degradation under load

**Quality Gates:**
- P95 latency < 30s under normal load
- No crashes under stress
- Resource usage within limits (< 80% CPU, < 2GB memory)
- Database connection pool not exhausted

**Success Metrics:**
- Throughput: > 10 campaigns/minute
- P95 latency: < 30s
- Error rate under load: < 1%
- Resource efficiency: < 1GB memory per request

**Tests:**
- Load: 100 concurrent campaign creations
- Stress: Ramp up to breaking point
- Soak: 1 hour continuous load
- Spike: Sudden 10x traffic increase

---

#### Task 3.4: Security audit (URL scraping, file uploads)

**Definition of Done:**
- SSRF vulnerability testing (10+ attack vectors)
- File upload security (malicious files, path traversal)
- SQL injection testing (all DB queries)
- XSS testing (all user inputs)
- CSRF protection verified
- Security report with findings and remediations

**Guardrails:**
- Audit performed by security expert
- All findings remediated before launch
- Penetration testing on staging
- Security headers enforced (CSP, HSTS, etc.)

**Quality Gates:**
- Zero critical vulnerabilities
- All high-severity issues fixed
- Medium/low issues documented with mitigation plan
- Security best practices followed (OWASP Top 10)

**Success Metrics:**
- Vulnerability count: 0 critical, 0 high
- Remediation time: < 48h for high-severity
- Security score: A+ (Mozilla Observatory)
- Compliance: GDPR, SOC 2 (if applicable)

**Tests:**
- SSRF: 10+ malicious URLs
- File upload: Malicious files (.exe, .sh, path traversal)
- SQL injection: All DB queries
- XSS: All user inputs
- CSRF: All state-changing operations

---

#### Task 3.5: Documentation updates

**Definition of Done:**
- API documentation (OpenAPI/Swagger)
- Admin user guide (with screenshots)
- Developer guide (architecture, setup)
- Troubleshooting guide (common errors)
- Changelog updated

**Guardrails:**
- Documentation versioned with code
- Screenshots up-to-date
- Examples tested and working
- Accessible format (Markdown + HTML)

**Quality Gates:**
- All endpoints documented
- All user flows covered
- Code examples compile and run
- Screenshots match current UI

**Success Metrics:**
- Documentation completeness: 100%
- User comprehension: > 90% (user testing)
- Support ticket reduction: > 30%
- Time to onboard new admin: < 15 minutes

**Tests:**
- Manual: Follow user guide, verify all steps work
- Manual: Run all code examples
- Automated: Link checker (no broken links)

---

#### Task 3.6: Admin training materials

**Definition of Done:**
- Video tutorial (5-10 minutes)
- Interactive demo (sandbox environment)
- FAQ document
- Best practices guide
- Training session conducted

**Guardrails:**
- Training materials reviewed by admins
- Feedback incorporated
- Materials accessible (subtitles, transcripts)
- Regular updates (quarterly)

**Quality Gates:**
- Video quality: 1080p, clear audio
- Demo environment stable
- FAQ covers 80% of common questions
- Training session attendance: 100%

**Success Metrics:**
- Admin proficiency: > 90% after training
- Training satisfaction: > 4.5/5
- Support ticket reduction: > 50%
- Time to create first campaign: < 5 minutes

**Tests:**
- Manual: Admin walkthrough (observe and collect feedback)
- Survey: Post-training assessment

---

### Phase 4: Polish & Launch (Week 4)

#### Task 4.1: UI/UX refinements based on feedback

**Definition of Done:**
- User testing with 3+ admins
- Feedback collected and prioritized
- Top 10 issues fixed
- UI polish (animations, micro-interactions)
- Accessibility improvements

**Guardrails:**
- Changes validated with users
- No breaking changes
- Performance not degraded
- Accessibility maintained

**Quality Gates:**
- User satisfaction: > 4.5/5
- Task completion rate: > 95%
- Error rate: < 5%
- Accessibility score: 100 (Lighthouse)

**Success Metrics:**
- User satisfaction improvement: +20%
- Task completion time reduction: -30%
- Error rate reduction: -50%
- NPS score: > 50

**Tests:**
- User testing: 3+ sessions with admins
- A/B testing: Compare old vs new UI (if applicable)
- Accessibility audit: WCAG 2.1 AA compliance

---

#### Task 4.2: Error handling improvements

**Definition of Done:**
- All error scenarios identified and handled
- User-friendly error messages
- Actionable error recovery steps
- Error logging and monitoring
- Retry mechanisms for transient errors

**Guardrails:**
- No silent failures
- Errors logged with context (user, timestamp, input)
- PII not logged
- Error rate alerts configured

**Quality Gates:**
- All error paths tested
- Error messages reviewed by UX
- Error recovery success rate: > 80%
- Mean time to recovery: < 5 minutes

**Success Metrics:**
- Error rate: < 1%
- Error recovery rate: > 80%
- User frustration: < 10% (user testing)
- Support tickets for errors: < 5/month

**Tests:**
- Error injection: 20+ scenarios
- User testing: Observe error recovery
- Monitoring: Verify alerts trigger correctly

---

#### Task 4.3: Monitoring & alerting setup

**Definition of Done:**
- Metrics dashboard (campaign creation rate, success rate, latency)
- Alerts for critical failures (error rate > 10%, latency > 60s)
- Log aggregation (Datadog, Sentry, or similar)
- On-call rotation defined
- Runbook for common incidents

**Guardrails:**
- Alerts actionable (not noisy)
- Alert fatigue prevention (smart grouping)
- Escalation policy defined
- Incident response SLA: < 15 minutes

**Quality Gates:**
- All critical metrics tracked
- Alerts tested (fire drill)
- Dashboard accessible to all stakeholders
- Runbook covers 80% of incidents

**Success Metrics:**
- Mean time to detection (MTTD): < 2 minutes
- Mean time to resolution (MTTR): < 30 minutes
- Alert accuracy: > 95% (no false positives)
- Incident response SLA met: > 95%

**Tests:**
- Fire drill: Trigger alerts, verify response
- Load testing: Verify metrics accuracy under load

---

#### Task 4.4: Rollout to production

**Definition of Done:**
- Deployment plan documented
- Rollback plan tested
- Feature flag enabled (gradual rollout)
- Monitoring active
- Stakeholders notified
- Go-live checklist completed

**Guardrails:**
- Gradual rollout (10% → 50% → 100%)
- Rollback trigger: error rate > 5%
- Zero downtime deployment
- Database migrations applied (with rollback tested)

**Quality Gates:**
- All pre-launch checks passed
- Smoke tests pass on production
- No critical bugs in first 24h
- Performance meets SLAs

**Success Metrics:**
- Deployment success: 100%
- Rollback count: 0
- Downtime: 0 minutes
- Critical bugs in first week: 0

**Tests:**
- Smoke tests: 10+ critical paths
- Canary deployment: 10% traffic for 1 hour
- Full rollout: Monitor for 24h

---

#### Task 4.5: Post-launch monitoring

**Definition of Done:**
- Daily metrics review (first week)
- Weekly metrics review (first month)
- User feedback collection
- Bug triage and prioritization
- Performance optimization (if needed)
- Success criteria validation

**Guardrails:**
- On-call rotation active
- Incident response ready
- Hotfix process defined
- Communication plan (stakeholders)

**Quality Gates:**
- All success criteria met (see Section 8)
- No critical bugs
- Performance SLAs met
- User satisfaction > 4.5/5

**Success Metrics:**
- Campaign creation rate: > 10/week
- Success rate: > 95%
- Average processing time: < 20s
- User satisfaction: > 4.5/5
- Support tickets: < 5/week

**Tests:**
- Manual: Daily metrics review
- Automated: Continuous monitoring
- User feedback: Surveys, interviews

---

## 4. Security Considerations

### 4.1 URL Scraping

**Risks:**
- SSRF (Server-Side Request Forgery)
- Malicious content injection
- Rate limiting abuse

**Mitigations:**
- Whitelist allowed domains (job boards)
- Timeout limits (10s max)
- Content sanitization (DOMPurify)
- Rate limiting per admin user

### 4.2 File Uploads

**Risks:**
- Malicious file execution
- Large file DoS
- Path traversal

**Mitigations:**
- File type validation (whitelist: .md, .txt, .pdf, .docx)
- Size limit (5MB max)
- Virus scanning (ClamAV)
- Sandboxed parsing

### 4.3 New Industry Creation

**Risks:**
- SQL injection (industry name)
- Type system bypass
- Unauthorized access

**Mitigations:**
- Parameterized queries
- Input validation (alphanumeric + spaces only)
- Admin-only access (ADMIN_EMAILS check)
- Audit logging

---

## 5. Monitoring & Observability

### 5.1 Metrics

**Campaign Creation:**
- Success rate
- Average processing time per step
- Failure reasons (categorized)
- Source type distribution (URL vs Text vs File)

**Industry Creation:**
- New industries created per month
- Industry usage distribution
- Type system update frequency

### 5.2 Alerts

**Critical:**
- Campaign creation failure rate > 10%
- Processing time > 60s
- Database migration failures

**Warning:**
- Scraping errors for specific domains
- LLM extraction confidence < 0.5
- Cache invalidation delays

---

## 6. Future Enhancements

### 6.1 AI-Powered Improvements

- **Auto-generate campaign copy** from job posting
- **Suggest metrics** based on industry benchmarks
- **Generate case studies** from similar campaigns
- **A/B test recommendations** for CTAs

### 6.2 Workflow Automation

- **Scheduled scraping** for recurring job postings
- **Auto-archive** expired campaigns
- **Bulk import** from job board APIs
- **Template library** for common industries

### 6.3 Analytics Integration

- **Campaign performance dashboard**
- **Conversion tracking** (job posting → application)
- **Heatmaps** for campaign pages
- **Cohort analysis** by industry

---

## 7. Open Questions & Decisions Needed

1. **Industry Type System**: Runtime validation (Option A) or code generation (Option B)?
   - **Recommendation**: Option A for MVP, Option B for production
   
2. **File Upload Storage**: Local filesystem or S3?
   - **Recommendation**: S3 for scalability
   
3. **Campaign Versioning**: Should we track campaign history?
   - **Recommendation**: Yes, add `campaign_versions` table
   
4. **Preview Environment**: Separate subdomain or query param?
   - **Recommendation**: Query param (`?preview=true`) for simplicity
   
5. **LLM Provider**: OpenAI only or multi-provider?
   - **Recommendation**: OpenAI for MVP, add fallbacks later

---

## 8. Success Criteria

**MVP Launch:**
- ✅ Admin can create campaign from URL in < 2 minutes
- ✅ 95% success rate for content extraction
- ✅ New industry creation works end-to-end
- ✅ Campaign goes live immediately after creation
- ✅ Zero security vulnerabilities in audit

**3 Months Post-Launch:**
- 50+ campaigns created via Admin UI
- 5+ new industries added
- < 5% failure rate
- Average processing time < 30s
- 90% admin satisfaction score

---

## 9. References

- [Job Posting Intelligence Spec](./JOB_POSTING_INTELLIGENCE_SPEC.md) - Workflow 1 & 3 details
- [Living Layouts Implementation](./LIVING_LAYOUTS_IMPLEMENTATION.md) - LL-1.1 completion status
- [Workflow 1 Validation Report](./WORKFLOW_1_VALIDATION.md) - Testing results
- [Admin Console Plan](../ADMIN_CONSOLE_PLAN.md) - Existing admin architecture

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-30  
**Author**: Cascade AI  
**Reviewers**: TBD
