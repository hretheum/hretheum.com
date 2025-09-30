/**
 * Content Scraping Module
 * 
 * Extract job posting content from URLs and files.
 * 
 * @see docs/aui/CAMPAIGN_CREATION_ARCHITECTURE.md - Task 1.2
 */

export { fetchJobPostingFromUrl, validateJobPostingUrl } from './url-fetcher'
export { parseJobPostingFile, validateFile, type SupportedFileType } from './file-parser'
