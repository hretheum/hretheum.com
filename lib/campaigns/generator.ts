/**
 * Campaign File Generator - Generate MDX campaign files
 * 
 * @see docs/aui/CAMPAIGN_CREATION_ARCHITECTURE.md - Task 1.3
 */

import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import type { CampaignMetadata, CampaignAdvanced } from './types'

const CAMPAIGNS_DIR = path.join(process.cwd(), 'data', 'campaigns')

/**
 * Campaign template interface
 */
export interface CampaignTemplate {
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
  ctas?: Array<{
    label: string
    href?: string
    variant?: 'primary' | 'secondary'
  }>
  sections?: Array<{ type: string }>
  metrics?: Array<{
    label: string
    value: string
    note?: string
  }>
  caseGrid?: {
    items: Array<{
      title: string
      subtitle?: string
      challenge?: string
      solution?: string
      outcome?: string
      details?: string
    }>
  }
}

/**
 * Validate campaign slug format
 */
export function validateCampaignSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 2) {
    return { valid: false, error: 'Slug too short (min 2 characters)' }
  }
  
  if (slug.length > 100) {
    return { valid: false, error: 'Slug too long (max 100 characters)' }
  }
  
  if (!/^[a-z0-9-_]+$/.test(slug)) {
    return { 
      valid: false, 
      error: 'Slug must be lowercase alphanumeric with hyphens/underscores only' 
    }
  }
  
  return { valid: true }
}

/**
 * Generate default accent color based on industry
 */
export function generateAccentColor(industry: string): string {
  const colors: Record<string, string> = {
    'Fintech': '#10b981',
    'InsurTech': '#3b82f6',
    'Telecom': '#e20074',
    'SaaS': '#8b5cf6',
    'E-commerce': '#f59e0b',
    'Gaming': '#ef4444',
    'HealthTech': '#06b6d4',
    'EdTech': '#6366f1',
    'Generic': '#6b7280',
  }
  return colors[industry] || '#7c3aed'
}

/**
 * Generate default headline based on industry and role
 */
export function generateDefaultHeadline(industry: string, role?: string): string {
  if (role) {
    return `${industry.toUpperCase()} ${role.toUpperCase()} OPPORTUNITY`
  }
  return `${industry.toUpperCase()} HIRING SIGNALS`
}

/**
 * Generate default CTAs
 */
export function generateDefaultCTAs(): Array<{ label: string; href?: string; variant: 'primary' | 'secondary' }> {
  return [
    { label: 'Spotkajmy się', variant: 'primary' },
    { label: 'Porozmawiaj z moim AI', href: 'https://hretheum.com', variant: 'secondary' },
  ]
}

/**
 * Generate default sections
 */
export function generateDefaultSections(): Array<{ type: string }> {
  return [
    { type: 'meta' },
    { type: 'metrics' },
    { type: 'playbook' },
    { type: 'timeline' },
    { type: 'closing_cta' },
  ]
}

/**
 * Generate campaign body content (MDX)
 */
function generateCampaignBody(template: CampaignTemplate): string {
  const sections: string[] = []
  
  // Section title
  sections.push(
    `<SectionTitle ` +
    `title="${template.role || template.brand.toUpperCase()}" ` +
    `subtitle="Leadership • Outcomes • Operating model" />\n`
  )
  
  // Metrics strip (if metrics provided)
  if (template.metrics && template.metrics.length > 0) {
    const metricsJson = JSON.stringify(template.metrics)
    sections.push(`<MetricsStrip items={${metricsJson}} />\n`)
  }
  
  // Outcome banner
  sections.push(
    `<OutcomeBanner text="From metrics to outcomes — measurably, scalably, consistently" />\n`
  )
  
  // Case grid (if provided)
  if (template.caseGrid && template.caseGrid.items.length > 0) {
    sections.push(`<SectionTitle title="Selected Projects" subtitle="Impact • Scope • Results" />\n`)
    sections.push(`<CaseGrid items={${JSON.stringify(template.caseGrid.items)}} />\n`)
  }
  
  // Closing
  sections.push(
    `<SectionTitle title="Next Steps" subtitle="Let's discuss how I can add value to your team" />\n`
  )
  
  return sections.join('\n')
}

/**
 * Generate campaign MDX file
 * 
 * @param template - Campaign template data
 * @returns Generated MDX content
 */
export async function generateCampaignMDX(template: CampaignTemplate): Promise<string> {
  // Validate slug
  const slugValidation = validateCampaignSlug(template.slug)
  if (!slugValidation.valid) {
    throw new Error(`Invalid campaign slug: ${slugValidation.error}`)
  }
  
  // Validate accent color if provided
  if (template.accent && !/^#[0-9A-Fa-f]{6}$/.test(template.accent)) {
    throw new Error(`Invalid accent color: ${template.accent}. Must be hex format (e.g., #e20074)`)
  }
  
  // Build frontmatter object
  const frontmatter: Record<string, any> = {
    slug: template.slug,
    brand: template.brand,
    industry: template.industry,
    accent: template.accent || generateAccentColor(template.industry),
    ctaVariant: template.ctaVariant || 'filled',
  }
  
  // Add optional fields if provided
  if (template.role) frontmatter.role = template.role
  if (template.location) frontmatter.location = template.location
  if (template.contract) frontmatter.contract = template.contract
  if (template.period) frontmatter.period = template.period
  
  frontmatter.hero_headline = template.heroHeadline || 
    generateDefaultHeadline(template.industry, template.role)
  
  frontmatter.ctas = template.ctas || generateDefaultCTAs()
  frontmatter.sections = template.sections || generateDefaultSections()
  
  if (template.metrics && template.metrics.length > 0) {
    frontmatter.metrics = template.metrics
  }
  
  if (template.caseGrid && template.caseGrid.items.length > 0) {
    frontmatter.case_grid = template.caseGrid
  }
  
  // Generate YAML frontmatter
  const yamlFrontmatter = yaml.dump(frontmatter, {
    indent: 2,
    lineWidth: -1, // No line wrapping
  })
  
  // Generate body
  const body = generateCampaignBody(template)
  
  // Combine into MDX
  const mdx = `---\n${yamlFrontmatter}---\n\n${body}`
  
  return mdx
}

/**
 * Write campaign file to disk (atomic operation)
 * 
 * @param slug - Campaign slug
 * @param content - MDX content
 */
export async function writeCampaignFile(slug: string, content: string): Promise<void> {
  const filePath = path.join(CAMPAIGNS_DIR, `${slug}.mdx`)
  const tempPath = `${filePath}.tmp`
  const backupPath = `${filePath}.backup`
  
  // Ensure campaigns directory exists
  await fs.mkdir(CAMPAIGNS_DIR, { recursive: true })
  
  // Check if file already exists (backup if so)
  try {
    await fs.access(filePath)
    // File exists, create backup
    await fs.copyFile(filePath, backupPath)
    console.log(`[campaigns] Backed up existing file: ${backupPath}`)
  } catch {
    // File doesn't exist, no backup needed
  }
  
  // Write to temp file first (atomic operation)
  await fs.writeFile(tempPath, content, 'utf-8')
  
  // Rename temp to final (atomic on POSIX systems)
  await fs.rename(tempPath, filePath)
  
  // Set proper permissions (644 = rw-r--r--)
  await fs.chmod(filePath, 0o644)
  
  console.log(`[campaigns] Campaign file written: ${filePath} (${content.length} bytes)`)
}

/**
 * Check if campaign file already exists
 */
export async function campaignFileExists(slug: string): Promise<boolean> {
  const filePath = path.join(CAMPAIGNS_DIR, `${slug}.mdx`)
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Delete campaign file
 */
export async function deleteCampaignFile(slug: string): Promise<void> {
  const filePath = path.join(CAMPAIGNS_DIR, `${slug}.mdx`)
  await fs.unlink(filePath)
  console.log(`[campaigns] Campaign file deleted: ${filePath}`)
}
