/**
 * Playwright Fetcher - Extract content from JavaScript-heavy sites
 * 
 * Handles sites requiring authentication modals, JavaScript execution, etc.
 * Used for LinkedIn and similar platforms that block simple HTTP scraping.
 * 
 * @see docs/aui/CAMPAIGN_CREATION_ARCHITECTURE.md - Task 1.2 Enhancement
 */

import { chromium, Browser, Page } from 'playwright'

const BROWSER_TIMEOUT_MS = 30000 // 30s total timeout
const NAVIGATION_TIMEOUT_MS = 15000 // 15s for page load
const MAX_CONTENT_LENGTH = 50000

let browserInstance: Browser | null = null

/**
 * Get or create browser instance (singleton)
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    })
  }
  return browserInstance
}

/**
 * Close browser instance (cleanup)
 */
export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

/**
 * Handle LinkedIn auth modal by pressing ESC
 */
async function handleLinkedInModal(page: Page) {
  try {
    // Wait a bit for modal to appear
    await page.waitForTimeout(2000)
    
    // Press ESC to close modal
    await page.keyboard.press('Escape')
    
    // Wait for modal to disappear
    await page.waitForTimeout(1000)
    
    console.log('[playwright] LinkedIn modal handled (ESC pressed)')
  } catch (error) {
    // Modal might not appear, that's OK
    console.log('[playwright] No modal detected or already closed')
  }
}

/**
 * Extract job posting content using Playwright
 * 
 * @param url - Job posting URL
 * @returns Extracted text content
 */
export async function fetchWithPlaywright(url: string): Promise<string> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  })
  
  const page = await context.newPage()
  
  try {
    // Set timeouts
    page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS)
    
    // Navigate to page
    console.log(`[playwright] Navigating to ${url}`)
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS 
    })
    
    // Check if it's LinkedIn and handle modal
    if (url.includes('linkedin.com')) {
      await handleLinkedInModal(page)
    }
    
    // Wait for main content to load
    await page.waitForTimeout(2000)
    
    // Try to find job description content
    let content = ''
    
    // LinkedIn selectors
    const linkedInSelectors = [
      '.description__text',
      '.show-more-less-html__markup',
      '.jobs-description__content',
      '[class*="description"]',
    ]
    
    // Generic selectors
    const genericSelectors = [
      '.job-description',
      '[data-test="job-description"]',
      'article',
      'main',
      '[role="main"]',
    ]
    
    const allSelectors = url.includes('linkedin.com') 
      ? [...linkedInSelectors, ...genericSelectors]
      : [...genericSelectors, ...linkedInSelectors]
    
    // Try each selector
    for (const selector of allSelectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          const text = await element.textContent()
          if (text && text.length > 200) {
            content = text
            console.log(`[playwright] Content extracted using selector: ${selector}`)
            break
          }
        }
      } catch {
        // Selector not found, try next
      }
    }
    
    // Fallback: get all body text
    if (!content) {
      content = await page.textContent('body') || ''
      console.log('[playwright] Using body text as fallback')
    }
    
    // Normalize content
    const normalized = content
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    
    // Validate
    if (normalized.length < 100) {
      throw new Error('Extracted content too short (< 100 chars). Page may not contain job posting.')
    }
    
    // Truncate if too long
    if (normalized.length > MAX_CONTENT_LENGTH) {
      console.warn(`[playwright] Content truncated from ${normalized.length} to ${MAX_CONTENT_LENGTH} chars`)
      return normalized.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated]'
    }
    
    console.log(`[playwright] Successfully extracted ${normalized.length} characters`)
    return normalized
    
  } finally {
    await page.close()
    await context.close()
  }
}

/**
 * Check if URL should use Playwright instead of simple fetch
 */
export function shouldUsePlaywright(url: string): boolean {
  const playwrightDomains = [
    'linkedin.com',
    // Add more domains that require JS execution
  ]
  
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    return playwrightDomains.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}
