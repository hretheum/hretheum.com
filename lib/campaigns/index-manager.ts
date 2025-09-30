// Campaign Index Manager - Task 1.5
// Manages brand → campaign file mappings with atomic operations and backup

import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'

// Configurable paths for testing
const CAMPAIGNS_DIR = process.env.TEST_CAMPAIGNS_DIR || path.join(process.cwd(), 'data', 'campaigns')
const INDEX_PATH = path.join(CAMPAIGNS_DIR, 'index.json')
const BACKUP_DIR = path.join(CAMPAIGNS_DIR, '.backups')
const MAX_BACKUPS = 10
const MAX_INDEX_SIZE = 1024 * 1024 // 1MB

// Schema validation
const CampaignIndexEntrySchema = z.object({
  slug: z.string().min(1),
  file: z.string().optional(),
  industry: z.string().optional(),
  role: z.string().optional(),
  accent: z.string().optional(),
})

const CampaignIndexSchema = z.record(z.string(), CampaignIndexEntrySchema)

export type CampaignIndexEntry = z.infer<typeof CampaignIndexEntrySchema>
export type CampaignIndex = z.infer<typeof CampaignIndexSchema>

/**
 * Lock mechanism using file system
 * Simple but effective for single-server deployments
 */
class FileLock {
  private lockPath: string
  private acquired = false
  
  constructor(resourcePath: string) {
    this.lockPath = `${resourcePath}.lock`
  }
  
  async acquire(timeoutMs = 5000): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Try to create lock file (exclusive)
        await fs.writeFile(this.lockPath, String(process.pid), { flag: 'wx' })
        this.acquired = true
        return
      } catch (error: any) {
        if (error.code !== 'EEXIST') throw error
        // Lock exists, wait and retry
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    throw new Error('Failed to acquire lock: timeout')
  }
  
  async release(): Promise<void> {
    if (!this.acquired) return
    
    try {
      await fs.unlink(this.lockPath)
      this.acquired = false
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
  }
}

/**
 * Read campaign index with validation
 */
async function readIndex(): Promise<CampaignIndex> {
  try {
    const content = await fs.readFile(INDEX_PATH, 'utf-8')
    const data = JSON.parse(content)
    
    // Validate schema
    return CampaignIndexSchema.parse(data)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Index doesn't exist, create empty
      return {}
    }
    throw new Error(`Failed to read index: ${error.message}`)
  }
}

/**
 * Write campaign index with validation and backup
 */
async function writeIndex(index: CampaignIndex): Promise<void> {
  // Validate before writing
  CampaignIndexSchema.parse(index)
  
  const content = JSON.stringify(index, null, 2) + '\n'
  
  // Check size limit
  if (content.length > MAX_INDEX_SIZE) {
    throw new Error(`Index size ${content.length} exceeds limit ${MAX_INDEX_SIZE}`)
  }
  
  // Create backup before writing
  await createBackup()
  
  // Write atomically (write to temp, then rename)
  const tempPath = `${INDEX_PATH}.tmp`
  await fs.writeFile(tempPath, content, 'utf-8')
  await fs.rename(tempPath, INDEX_PATH)
}

/**
 * Create backup of current index
 */
async function createBackup(): Promise<void> {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    
    // Read current index
    const current = await fs.readFile(INDEX_PATH, 'utf-8')
    
    // Create timestamped backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(BACKUP_DIR, `index-${timestamp}.json`)
    await fs.writeFile(backupPath, current, 'utf-8')
    
    // Cleanup old backups (keep last 10)
    await cleanupOldBackups()
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.warn('[index-manager] Failed to create backup:', error.message)
    }
  }
}

/**
 * Remove old backups, keeping only MAX_BACKUPS most recent
 */
async function cleanupOldBackups(): Promise<void> {
  try {
    const files = await fs.readdir(BACKUP_DIR)
    const backups = files
      .filter(f => f.startsWith('index-') && f.endsWith('.json'))
      .sort()
      .reverse() // Newest first
    
    // Delete old backups
    for (let i = MAX_BACKUPS; i < backups.length; i++) {
      await fs.unlink(path.join(BACKUP_DIR, backups[i]))
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Validate that referenced campaign file exists
 */
async function validateCampaignFile(slug: string): Promise<boolean> {
  const fileName = `${slug}.mdx`
  const filePath = path.join(CAMPAIGNS_DIR, fileName)
  
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Update campaign index - add or update brand mapping
 * 
 * @param brandSlug - Brand identifier (e.g., "tmobile")
 * @param campaignSlug - Campaign file slug (e.g., "tmobile_g2m_lead")
 * @param metadata - Optional metadata (industry, role, accent)
 * @returns Success status
 */
export async function updateCampaignIndex(
  brandSlug: string,
  campaignSlug: string,
  metadata?: Partial<Omit<CampaignIndexEntry, 'slug'>>
): Promise<{ success: boolean; error?: string }> {
  const lock = new FileLock(INDEX_PATH)
  
  try {
    // Acquire lock
    await lock.acquire()
    
    // Validate campaign file exists
    const fileExists = await validateCampaignFile(campaignSlug)
    if (!fileExists) {
      return {
        success: false,
        error: `Campaign file ${campaignSlug}.mdx does not exist`
      }
    }
    
    // Read current index
    const index = await readIndex()
    
    // Check for duplicate slugs (different brands pointing to same campaign)
    const existingBrand = Object.entries(index).find(
      ([brand, entry]) => brand !== brandSlug && entry.slug === campaignSlug
    )
    
    if (existingBrand) {
      console.warn(`[index-manager] Warning: Campaign ${campaignSlug} already mapped to brand ${existingBrand[0]}`)
    }
    
    // Update mapping
    index[brandSlug] = {
      slug: campaignSlug,
      ...metadata
    }
    
    // Write with backup
    await writeIndex(index)
    
    console.log(`[index-manager] Updated brand "${brandSlug}" → campaign "${campaignSlug}"`)
    
    return { success: true }
  } catch (error: any) {
    console.error('[index-manager] Update failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  } finally {
    await lock.release()
  }
}

/**
 * Remove campaign from index
 * 
 * @param brandSlug - Brand identifier to remove
 * @returns Success status
 */
export async function removeCampaignFromIndex(
  brandSlug: string
): Promise<{ success: boolean; error?: string }> {
  const lock = new FileLock(INDEX_PATH)
  
  try {
    // Acquire lock
    await lock.acquire()
    
    // Read current index
    const index = await readIndex()
    
    // Check if brand exists
    if (!index[brandSlug]) {
      return {
        success: false,
        error: `Brand "${brandSlug}" not found in index`
      }
    }
    
    // Remove mapping
    delete index[brandSlug]
    
    // Write with backup
    await writeIndex(index)
    
    console.log(`[index-manager] Removed brand "${brandSlug}" from index`)
    
    return { success: true }
  } catch (error: any) {
    console.error('[index-manager] Remove failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  } finally {
    await lock.release()
  }
}

/**
 * Get campaign mapping for a brand
 */
export async function getCampaignForBrand(brandSlug: string): Promise<CampaignIndexEntry | null> {
  try {
    const index = await readIndex()
    return index[brandSlug] || null
  } catch (error) {
    console.error('[index-manager] Failed to get campaign:', error)
    return null
  }
}

/**
 * List all brand → campaign mappings
 */
export async function listAllCampaigns(): Promise<CampaignIndex> {
  try {
    return await readIndex()
  } catch (error) {
    console.error('[index-manager] Failed to list campaigns:', error)
    return {}
  }
}

/**
 * Validate index integrity
 * Checks for orphaned campaigns, missing files, etc.
 */
export async function validateIndex(): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const index = await readIndex()
    
    // Check each entry
    for (const [brand, entry] of Object.entries(index)) {
      // Validate campaign file exists
      const fileExists = await validateCampaignFile(entry.slug)
      if (!fileExists) {
        errors.push(`Brand "${brand}": Campaign file ${entry.slug}.mdx not found`)
      }
      
      // Check for empty brand slugs
      if (!brand || brand.trim().length === 0) {
        errors.push('Empty brand slug found')
      }
    }
    
    // Check for duplicate campaign slugs
    const slugCounts = new Map<string, string[]>()
    for (const [brand, entry] of Object.entries(index)) {
      const brands = slugCounts.get(entry.slug) || []
      brands.push(brand)
      slugCounts.set(entry.slug, brands)
    }
    
    for (const [slug, brands] of slugCounts) {
      if (brands.length > 1) {
        warnings.push(`Campaign "${slug}" mapped to multiple brands: ${brands.join(', ')}`)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Index validation failed: ${error.message}`],
      warnings: []
    }
  }
}
