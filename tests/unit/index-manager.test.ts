import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import {
  updateCampaignIndex,
  removeCampaignFromIndex,
  getCampaignForBrand,
  listAllCampaigns,
  validateIndex,
  type CampaignIndex
} from '../../lib/campaigns/index-manager'

const TEST_DIR = path.join(process.cwd(), 'data', 'campaigns', '.test')
const TEST_INDEX = path.join(TEST_DIR, 'index.json')
const TEST_BACKUP_DIR = path.join(TEST_DIR, '.backups')

// Mock index path for testing
const originalIndexPath = path.join(process.cwd(), 'data', 'campaigns', 'index.json')

describe('Campaign Index Manager', () => {
  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(TEST_DIR, { recursive: true })
    
    // Create empty index
    await fs.writeFile(TEST_INDEX, '{}', 'utf-8')
    
    // Create test campaign files
    await fs.writeFile(path.join(TEST_DIR, 'test-campaign.mdx'), '# Test', 'utf-8')
    await fs.writeFile(path.join(TEST_DIR, 'another-campaign.mdx'), '# Another', 'utf-8')
  })
  
  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true })
    } catch {}
  })
  
  describe('updateCampaignIndex', () => {
    it('should add new brand mapping', async () => {
      const result = await updateCampaignIndex('testbrand', 'test-campaign')
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      
      const campaign = await getCampaignForBrand('testbrand')
      expect(campaign).toEqual({ slug: 'test-campaign' })
    })
    
    it('should update existing brand mapping', async () => {
      await updateCampaignIndex('testbrand', 'test-campaign')
      const result = await updateCampaignIndex('testbrand', 'another-campaign')
      
      expect(result.success).toBe(true)
      
      const campaign = await getCampaignForBrand('testbrand')
      expect(campaign?.slug).toBe('another-campaign')
    })
    
    it('should fail if campaign file does not exist', async () => {
      const result = await updateCampaignIndex('testbrand', 'nonexistent-campaign')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('does not exist')
    })
    
    it('should store metadata', async () => {
      const result = await updateCampaignIndex('testbrand', 'test-campaign', {
        industry: 'SaaS',
        role: 'Product Designer',
        accent: '#FF0000'
      })
      
      expect(result.success).toBe(true)
      
      const campaign = await getCampaignForBrand('testbrand')
      expect(campaign).toEqual({
        slug: 'test-campaign',
        industry: 'SaaS',
        role: 'Product Designer',
        accent: '#FF0000'
      })
    })
    
    it('should create backup before update', async () => {
      await updateCampaignIndex('testbrand', 'test-campaign')
      
      // Check backup directory exists
      const backupFiles = await fs.readdir(TEST_BACKUP_DIR)
      expect(backupFiles.length).toBeGreaterThan(0)
      expect(backupFiles[0]).toMatch(/^index-.*\.json$/)
    })
  })
  
  describe('removeCampaignFromIndex', () => {
    it('should remove existing brand', async () => {
      await updateCampaignIndex('testbrand', 'test-campaign')
      
      const result = await removeCampaignFromIndex('testbrand')
      
      expect(result.success).toBe(true)
      
      const campaign = await getCampaignForBrand('testbrand')
      expect(campaign).toBeNull()
    })
    
    it('should fail if brand does not exist', async () => {
      const result = await removeCampaignFromIndex('nonexistent')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
    
    it('should create backup before removal', async () => {
      await updateCampaignIndex('testbrand', 'test-campaign')
      
      // Clear previous backups
      try {
        await fs.rm(TEST_BACKUP_DIR, { recursive: true })
      } catch {}
      
      await removeCampaignFromIndex('testbrand')
      
      const backupFiles = await fs.readdir(TEST_BACKUP_DIR)
      expect(backupFiles.length).toBeGreaterThan(0)
    })
  })
  
  describe('getCampaignForBrand', () => {
    it('should return null for non-existent brand', async () => {
      const campaign = await getCampaignForBrand('nonexistent')
      expect(campaign).toBeNull()
    })
    
    it('should return campaign entry for existing brand', async () => {
      await updateCampaignIndex('testbrand', 'test-campaign')
      
      const campaign = await getCampaignForBrand('testbrand')
      expect(campaign).toEqual({ slug: 'test-campaign' })
    })
  })
  
  describe('listAllCampaigns', () => {
    it('should return empty object for empty index', async () => {
      const campaigns = await listAllCampaigns()
      expect(campaigns).toEqual({})
    })
    
    it('should return all campaigns', async () => {
      await updateCampaignIndex('brand1', 'test-campaign')
      await updateCampaignIndex('brand2', 'another-campaign')
      
      const campaigns = await listAllCampaigns()
      
      expect(Object.keys(campaigns)).toHaveLength(2)
      expect(campaigns['brand1']).toEqual({ slug: 'test-campaign' })
      expect(campaigns['brand2']).toEqual({ slug: 'another-campaign' })
    })
  })
  
  describe('validateIndex', () => {
    it('should validate empty index', async () => {
      const result = await validateIndex()
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should detect missing campaign files', async () => {
      // Manually add entry without creating file
      await fs.writeFile(TEST_INDEX, JSON.stringify({
        testbrand: { slug: 'missing-campaign' }
      }), 'utf-8')
      
      const result = await validateIndex()
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('not found')
    })
    
    it('should warn about duplicate campaign mappings', async () => {
      await updateCampaignIndex('brand1', 'test-campaign')
      await updateCampaignIndex('brand2', 'test-campaign')
      
      const result = await validateIndex()
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('multiple brands')
    })
  })
  
  describe('Atomic operations', () => {
    it('should handle concurrent updates', async () => {
      // Simulate concurrent updates to different brands
      const results = await Promise.all([
        updateCampaignIndex('brand1', 'test-campaign'),
        updateCampaignIndex('brand2', 'another-campaign'),
        updateCampaignIndex('brand3', 'test-campaign')
      ])
      
      // All should succeed
      expect(results.every(r => r.success)).toBe(true)
      
      // Verify all entries
      const campaigns = await listAllCampaigns()
      expect(Object.keys(campaigns)).toHaveLength(3)
    })
  })
  
  describe('Backup management', () => {
    it('should keep only MAX_BACKUPS (10) backups', async () => {
      // Create 15 updates to generate backups
      for (let i = 0; i < 15; i++) {
        await updateCampaignIndex('testbrand', 'test-campaign')
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      const backupFiles = await fs.readdir(TEST_BACKUP_DIR)
      
      // Should have at most 10 backups
      expect(backupFiles.length).toBeLessThanOrEqual(10)
    })
  })
})
