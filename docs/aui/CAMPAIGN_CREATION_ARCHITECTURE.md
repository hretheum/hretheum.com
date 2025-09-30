# Campaign Creation Architecture & Admin UI Specification

**Status**: Design Phase  
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

**Tasks:**
1. ✅ Create `/api/admin/campaigns/create` endpoint
2. ✅ Implement content scraping module (`lib/scraping/`)
3. ✅ Implement campaign file generator (`lib/campaigns/generator.ts`)
4. ✅ Implement index manager (`lib/campaigns/index-manager.ts`)
5. ✅ Add new industry creation flow
6. ✅ Database migrations for `industries` table
7. ✅ Unit tests for all modules

### Phase 2: Admin UI (Week 2)

**Tasks:**
1. ✅ Create "Campaigns" tab in `/admin`
2. ✅ Build campaign creation form (3 input methods)
3. ✅ Add real-time processing status display
4. ✅ Implement campaign list view with filters
5. ✅ Add preview functionality
6. ✅ E2E tests with Playwright

### Phase 3: Integration & Testing (Week 3)

**Tasks:**
1. ✅ Integrate with existing job posting pipeline
2. ✅ Test full workflow (URL → Campaign → Live)
3. ✅ Performance testing (large job postings)
4. ✅ Security audit (URL scraping, file uploads)
5. ✅ Documentation updates
6. ✅ Admin training materials

### Phase 4: Polish & Launch (Week 4)

**Tasks:**
1. ✅ UI/UX refinements based on feedback
2. ✅ Error handling improvements
3. ✅ Monitoring & alerting setup
4. ✅ Rollout to production
5. ✅ Post-launch monitoring

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
