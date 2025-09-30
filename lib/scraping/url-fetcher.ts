/**
 * URL Fetcher - Extract job posting content from URLs
 * 
 * @see docs/aui/CAMPAIGN_CREATION_ARCHITECTURE.md - Task 1.2
 */

import * as cheerio from 'cheerio'

// Domain whitelist for security (SSRF prevention)
const ALLOWED_DOMAINS = new Set([
  'pracuj.pl',
  'nofluffjobs.com',
  'justjoin.it',
  'rocketjobs.pl',
  'bulldogjob.pl',
  'theprotocol.it',
  'linkedin.com',
  'indeed.com',
])

const FETCH_TIMEOUT_MS = 10000 // 10s timeout
const MAX_CONTENT_LENGTH = 50000 // 50k chars

/**
 * Validate if URL domain is whitelisted
 */
function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Check if hostname ends with any allowed domain
    return Array.from(ALLOWED_DOMAINS).some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

/**
 * Normalize extracted content
 */
function normalizeContent(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double newline
    .trim()
}

/**
 * Common selectors for job posting content
 */
const JOB_POSTING_SELECTORS = [
  // Pracuj.pl
  '.offer-description',
  '[data-test="section-responsibilities"]',
  '[data-test="section-requirements"]',
  
  // NoFluffJobs
  '.posting-details',
  '[data-test="job-description"]',
  
  // JustJoinIt
  '.css-1id4k1',
  '[data-test="offer-description"]',
  
  // Generic fallbacks
  '.job-description',
  '.job-content',
  '[role="main"]',
  'article',
  'main',
  '.content',
]

/**
 * Fetch and extract job posting content from URL
 * 
 * @param url - Job posting URL
 * @returns Extracted text content
 * @throws Error if URL is not allowed, fetch fails, or content invalid
 */
export async function fetchJobPostingFromUrl(url: string): Promise<string> {
  // Step 1: Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('URL must start with http:// or https://')
  }
  
  // Step 2: Validate domain (SSRF prevention)
  if (!isAllowedDomain(url)) {
    const urlObj = new URL(url)
    throw new Error(
      `Domain "${urlObj.hostname}" is not whitelisted. ` +
      `Allowed domains: ${Array.from(ALLOWED_DOMAINS).join(', ')}`
    )
  }
  
  // Step 3: Fetch with timeout and retry logic
  let html: string
  let attempt = 0
  const maxAttempts = 3
  
  while (attempt < maxAttempts) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HretheumBot/1.0; +https://hretheum.com)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      html = await response.text()
      break
      
    } catch (error: any) {
      attempt++
      
      if (error.name === 'AbortError') {
        if (attempt === maxAttempts) {
          throw new Error(`Fetch timeout after ${maxAttempts} attempts (${FETCH_TIMEOUT_MS}ms each)`)
        }
        // Retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      } else {
        throw new Error(`Fetch failed: ${error.message}`)
      }
    }
  }
  
  // Step 4: Parse HTML and extract content
  const $ = cheerio.load(html!)
  
  let content = ''
  
  // Try specific selectors first
  for (const selector of JOB_POSTING_SELECTORS) {
    const text = $(selector).text()
    if (text.length > 200) {
      content = text
      break
    }
  }
  
  // Fallback: extract all text from body
  if (!content) {
    content = $('body').text()
  }
  
  // Step 5: Normalize and validate
  const normalized = normalizeContent(content)
  
  if (normalized.length < 100) {
    throw new Error('Extracted content too short (< 100 chars). Page may not contain job posting.')
  }
  
  if (normalized.length > MAX_CONTENT_LENGTH) {
    // Truncate with warning
    console.warn(`[scraping] Content truncated from ${normalized.length} to ${MAX_CONTENT_LENGTH} chars`)
    return normalized.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated]'
  }
  
  return normalized
}

/**
 * Check if URL is from a whitelisted domain (for validation)
 */
export function validateJobPostingUrl(url: string): { valid: boolean; error?: string } {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { valid: false, error: 'URL must start with http:// or https://' }
    }
    
    if (!isAllowedDomain(url)) {
      const urlObj = new URL(url)
      return { 
        valid: false, 
        error: `Domain "${urlObj.hostname}" is not whitelisted. Allowed: ${Array.from(ALLOWED_DOMAINS).join(', ')}` 
      }
    }
    
    return { valid: true }
  } catch (error: any) {
    return { valid: false, error: error.message }
  }
}
