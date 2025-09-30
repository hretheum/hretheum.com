/**
 * Content Scraping Module
 * 
 * Extract job posting content from URLs and files.
 * 
 * @see docs/aui/CAMPAIGN_CREATION_ARCHITECTURE.md
 */

// Re-export all scraping functions
export { fetchJobPostingFromUrl, validateJobPostingUrl } from './url-fetcher'
export { parseJobPostingFile, validateFile } from './file-parser'
export { closeBrowser } from './playwright-fetcher'
export type { SupportedFileType } from './file-parser'
