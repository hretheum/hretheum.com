// Industry Manager - Task 1.6
// Creates new industries with DB entry, templates, and config updates

import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'

const BRAND_CONFIG_PATH = path.join(process.cwd(), 'data', 'brand_industries.json')
const CAMPAIGNS_DIR = path.join(process.cwd(), 'data', 'campaigns')
const TEMPLATES_DIR = path.join(CAMPAIGNS_DIR, 'templates')

// Validation schema
const IndustryNameSchema = z.string()
  .min(3, 'Industry name must be at least 3 characters')
  .max(50, 'Industry name must be at most 50 characters')
  .regex(/^[a-zA-Z0-9\s&-]+$/, 'Industry name can only contain letters, numbers, spaces, &, and -')

// Default accent colors pool
const DEFAULT_ACCENT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#06b6d4', // Cyan
]

/**
 * Generate slug from industry name
 * @param name - Industry name (e.g., "Health Care")
 * @returns kebab-case slug (e.g., "health-care")
 */
export function generateIndustrySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-|-$/g, '') // Trim hyphens
}

/**
 * Get default accent color (rotates through pool)
 */
function getDefaultAccentColor(existingCount: number): string {
  return DEFAULT_ACCENT_COLORS[existingCount % DEFAULT_ACCENT_COLORS.length]
}

/**
 * Read brand_industries.json
 */
async function readBrandConfig(): Promise<any> {
  try {
    const content = await fs.readFile(BRAND_CONFIG_PATH, 'utf-8')
    return JSON.parse(content)
  } catch (error: any) {
    throw new Error(`Failed to read brand config: ${error.message}`)
  }
}

/**
 * Write brand_industries.json with backup
 */
async function writeBrandConfig(config: any): Promise<void> {
  // Create backup
  const backupPath = `${BRAND_CONFIG_PATH}.backup-${Date.now()}`
  try {
    const current = await fs.readFile(BRAND_CONFIG_PATH, 'utf-8')
    await fs.writeFile(backupPath, current, 'utf-8')
  } catch (error) {
    console.warn('[industry-manager] Failed to create backup:', error)
  }
  
  // Write new config
  const content = JSON.stringify(config, null, 2) + '\n'
  await fs.writeFile(BRAND_CONFIG_PATH, content, 'utf-8')
}

/**
 * Create template files for new industry
 */
async function createIndustryTemplates(slug: string, name: string, accent: string): Promise<void> {
  const templateDir = path.join(TEMPLATES_DIR, slug)
  await fs.mkdir(templateDir, { recursive: true })
  
  // Create default campaign template
  const templateContent = `---
slug: ${slug}_default
brand: example
industry: ${name}
accent: "${accent}"
ctaVariant: filled
hero_headline: "Hiring signals for ${name} teams"
ctas:
  - label: "Book a chat"
    variant: primary
  - label: "Chat with my AI"
    variant: secondary
---

<Hero>
  <MetricsStrip>
    <Metric label="Projects" value="15+" />
    <Metric label="Industries" value="8+" />
    <Metric label="Impact" value="High" />
  </MetricsStrip>
</Hero>

<OutcomeBanner>
  Strategic ${name} leadership with measurable impact
</OutcomeBanner>

<Section>
  <SectionTitle>Your ${name} Playbook</SectionTitle>
  <Playbook>
    - Vision: Define ${name} strategy aligned with business goals
    - Team: Build and mentor high-performing teams
    - Delivery: Ship outcomes, not just features
    - Tools: Modern ${name} stack and processes
    - Metrics: Data-driven decision making
    - Quality: Excellence at scale
  </Playbook>
</Section>

{/* Add more sections as needed */}

<CTABanner 
  label="Let's talk about your ${name} role" 
  href="https://calendly.com/hretheum/short-intro" 
/>
`
  
  const templatePath = path.join(templateDir, 'default.mdx')
  await fs.writeFile(templatePath, templateContent, 'utf-8')
}

/**
 * Create audit log entry
 */
async function createAuditLog(industry: string, slug: string, adminEmail?: string): Promise<void> {
  const logDir = path.join(process.cwd(), 'data', '.audit')
  await fs.mkdir(logDir, { recursive: true })
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: 'create_industry',
    industry,
    slug,
    adminEmail: adminEmail || 'unknown',
  }
  
  const logPath = path.join(logDir, 'industries.log')
  const logLine = JSON.stringify(logEntry) + '\n'
  
  try {
    await fs.appendFile(logPath, logLine, 'utf-8')
  } catch (error) {
    console.warn('[industry-manager] Failed to write audit log:', error)
  }
}

export interface CreateIndustryResult {
  success: boolean
  industry?: string
  slug?: string
  accent?: string
  error?: string
}

/**
 * Create a new industry
 * 
 * @param name - Industry display name (e.g., "Health Care")
 * @param options - Optional accent color and admin email
 * @returns Result with created industry details or error
 */
export async function createNewIndustry(
  name: string,
  options?: { accent?: string; adminEmail?: string }
): Promise<CreateIndustryResult> {
  try {
    // Step 1: Validate name
    const validatedName = IndustryNameSchema.parse(name.trim())
    
    // Step 2: Generate slug
    const slug = generateIndustrySlug(validatedName)
    
    if (!slug || slug.length < 2) {
      return {
        success: false,
        error: 'Generated slug is too short. Please use a different name.'
      }
    }
    
    // Step 3: Read current config
    const config = await readBrandConfig()
    
    // Step 4: Check for duplicates
    const existingIndustries = Array.isArray(config.allowed) ? config.allowed : []
    
    // Check exact name match
    if (existingIndustries.some((i: string) => i.toLowerCase() === validatedName.toLowerCase())) {
      return {
        success: false,
        error: `Industry "${validatedName}" already exists`
      }
    }
    
    // Check slug collision
    if (existingIndustries.some((i: string) => generateIndustrySlug(i) === slug)) {
      return {
        success: false,
        error: `Industry with similar name already exists (slug conflict: ${slug})`
      }
    }
    
    // Step 5: Get or assign accent color
    const accent = options?.accent || getDefaultAccentColor(existingIndustries.length)
    
    // Step 6: Update config
    config.allowed = [...existingIndustries, validatedName]
    await writeBrandConfig(config)
    
    console.log(`[industry-manager] Added "${validatedName}" to brand_industries.json`)
    
    // Step 7: Create templates
    try {
      await createIndustryTemplates(slug, validatedName, accent)
      console.log(`[industry-manager] Created templates in data/campaigns/templates/${slug}/`)
    } catch (error: any) {
      console.error('[industry-manager] Template creation failed:', error.message)
      // Don't fail the entire operation if templates fail
    }
    
    // Step 8: Create audit log
    await createAuditLog(validatedName, slug, options?.adminEmail)
    
    // Step 9: Success
    console.log(`[industry-manager] ✓ Created industry "${validatedName}" (slug: ${slug})`)
    
    return {
      success: true,
      industry: validatedName,
      slug,
      accent
    }
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed'
      }
    }
    
    console.error('[industry-manager] Create industry failed:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * List all industries from config
 */
export async function listAllIndustries(): Promise<string[]> {
  try {
    const config = await readBrandConfig()
    return Array.isArray(config.allowed) ? config.allowed : []
  } catch (error) {
    console.error('[industry-manager] Failed to list industries:', error)
    return []
  }
}

/**
 * Check if industry exists
 */
export async function industryExists(name: string): Promise<boolean> {
  const industries = await listAllIndustries()
  return industries.some(i => i.toLowerCase() === name.toLowerCase())
}
