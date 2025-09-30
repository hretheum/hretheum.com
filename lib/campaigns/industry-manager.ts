// Industry Manager - Task 1.6 (Database-driven)
// Creates new industries in Supabase with templates and audit

import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const CAMPAIGNS_DIR = path.join(process.cwd(), 'data', 'campaigns')
const TEMPLATES_DIR = path.join(CAMPAIGNS_DIR, 'templates')

// Supabase client (uses service role for write access)
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  }
  
  return createClient(url, key, { auth: { persistSession: false } })
}

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
 * Get all industries from database
 */
async function getAllIndustriesFromDB(): Promise<Array<{ name: string; slug: string }>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('industries')
    .select('name, slug')
    .eq('is_active', true)
    .order('name')
  
  if (error) {
    throw new Error(`Failed to fetch industries: ${error.message}`)
  }
  
  return data || []
}

/**
 * Check if industry exists in database
 */
async function industryExistsInDB(name: string, slug: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { data, error} = await supabase
    .from('industries')
    .select('name, slug')
    .or(`name.ilike.${name},slug.eq.${slug}`)
    .single()
  
  return !!data && !error
}

/**
 * Sync industry to JSON for backward compatibility
 * Temporary during migration - keeps JSON in sync with DB
 */
async function syncIndustryToJSON(industryName: string): Promise<void> {
  const configPath = path.join(process.cwd(), 'data', 'brand_industries.json')
  
  try {
    const content = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(content)
    
    if (!Array.isArray(config.allowed)) {
      config.allowed = []
    }
    
    // Add if not already present
    if (!config.allowed.includes(industryName)) {
      config.allowed.push(industryName)
      const updated = JSON.stringify(config, null, 2) + '\n'
      await fs.writeFile(configPath, updated, 'utf-8')
    }
  } catch (error) {
    // Ignore sync errors - DB is source of truth
    console.warn('[industry-manager] JSON sync failed:', error)
  }
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
    
    // Step 3: Check for duplicates in database
    const exists = await industryExistsInDB(validatedName, slug)
    if (exists) {
      return {
        success: false,
        error: `Industry "${validatedName}" or slug "${slug}" already exists`
      }
    }
    
    // Step 4: Get all industries to determine accent color
    const existingIndustries = await getAllIndustriesFromDB()
    
    // Step 5: Get or assign accent color
    const accent = options?.accent || getDefaultAccentColor(existingIndustries.length)
    
    // Step 6: Insert into database
    const supabase = getSupabaseClient()
    const { data: inserted, error: insertError } = await supabase
      .from('industries')
      .insert({
        name: validatedName,
        slug: slug,
        accent_color: accent,
        created_by: options?.adminEmail || 'system',
        is_active: true
      })
      .select()
      .single()
    
    if (insertError) {
      throw new Error(`Failed to create industry: ${insertError.message}`)
    }
    
    console.log(`[industry-manager] Added "${validatedName}" to industries table (DB)`)
    
    // Step 6b: Sync to JSON for backward compatibility (temporary during migration)
    try {
      await syncIndustryToJSON(validatedName)
      console.log(`[industry-manager] Synced "${validatedName}" to brand_industries.json`)
    } catch (error: any) {
      console.warn('[industry-manager] Failed to sync to JSON:', error.message)
      // Don't fail - DB is source of truth
    }
    
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
 * List all industries from database
 */
export async function listAllIndustries(): Promise<string[]> {
  try {
    const industries = await getAllIndustriesFromDB()
    return industries.map(i => i.name)
  } catch (error) {
    console.error('[industry-manager] Failed to list industries:', error)
    return []
  }
}

/**
 * Check if industry exists in database
 */
export async function industryExists(name: string): Promise<boolean> {
  try {
    const slug = generateIndustrySlug(name)
    return await industryExistsInDB(name, slug)
  } catch (error) {
    console.error('[industry-manager] Failed to check industry existence:', error)
    return false
  }
}
