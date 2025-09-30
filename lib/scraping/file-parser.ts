/**
 * File Parser - Parse job posting files (.md, .txt, .pdf, .docx)
 * 
 * @see docs/aui/CAMPAIGN_CREATION_ARCHITECTURE.md - Task 1.2
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_CONTENT_LENGTH = 50000 // 50k chars

/**
 * Supported file types
 */
export type SupportedFileType = 'md' | 'txt' | 'pdf' | 'docx'

/**
 * Normalize content (consistent with url-fetcher)
 */
function normalizeContent(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Parse markdown/text files
 */
async function parseTextFile(content: string): Promise<string> {
  return normalizeContent(content)
}

/**
 * Parse PDF file (placeholder - requires pdf-parse library)
 * 
 * TODO: Install pdf-parse: npm install pdf-parse
 * For MVP, we'll use a simplified approach
 */
async function parsePDF(buffer: Buffer): Promise<string> {
  // For now, return placeholder
  // In production, use: const pdfParse = require('pdf-parse')
  // const data = await pdfParse(buffer)
  // return data.text
  
  throw new Error('PDF parsing not yet implemented. Please use .md or .txt format, or paste content directly.')
}

/**
 * Parse DOCX file (placeholder - requires mammoth library)
 * 
 * TODO: Install mammoth: npm install mammoth
 * For MVP, we'll use a simplified approach
 */
async function parseDOCX(buffer: Buffer): Promise<string> {
  // For now, return placeholder
  // In production, use: const mammoth = require('mammoth')
  // const result = await mammoth.extractRawText({ buffer })
  // return result.value
  
  throw new Error('DOCX parsing not yet implemented. Please use .md or .txt format, or paste content directly.')
}

/**
 * Parse job posting from base64-encoded file data
 * 
 * @param fileData - Base64-encoded file content
 * @param fileName - Original file name
 * @param fileType - File type (md, txt, pdf, docx)
 * @returns Parsed and normalized text content
 * @throws Error if file is too large, invalid format, or parsing fails
 */
export async function parseJobPostingFile(
  fileData: string,
  fileName: string,
  fileType: SupportedFileType
): Promise<string> {
  // Step 1: Decode base64
  let buffer: Buffer
  try {
    buffer = Buffer.from(fileData, 'base64')
  } catch (error) {
    throw new Error('Invalid base64 encoding in file data')
  }
  
  // Step 2: Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2)
    throw new Error(`File too large: ${sizeMB}MB (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`)
  }
  
  if (buffer.length === 0) {
    throw new Error('File is empty')
  }
  
  // Step 3: Parse based on file type
  let content: string
  
  switch (fileType) {
    case 'md':
    case 'txt':
      content = buffer.toString('utf-8')
      content = await parseTextFile(content)
      break
    
    case 'pdf':
      content = await parsePDF(buffer)
      break
    
    case 'docx':
      content = await parseDOCX(buffer)
      break
    
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
  
  // Step 4: Validate content length
  if (content.length < 100) {
    throw new Error('File content too short (< 100 chars). Please check if file contains job posting.')
  }
  
  if (content.length > MAX_CONTENT_LENGTH) {
    console.warn(`[scraping] Content truncated from ${content.length} to ${MAX_CONTENT_LENGTH} chars`)
    content = content.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated]'
  }
  
  return content
}

/**
 * Validate file before processing
 */
export function validateFile(
  fileSize: number,
  fileType: string
): { valid: boolean; error?: string } {
  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `File too large: ${sizeMB}MB (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
    }
  }
  
  if (fileSize === 0) {
    return { valid: false, error: 'File is empty' }
  }
  
  // Check file type
  const supportedTypes: SupportedFileType[] = ['md', 'txt', 'pdf', 'docx']
  if (!supportedTypes.includes(fileType as SupportedFileType)) {
    return {
      valid: false,
      error: `Unsupported file type: ${fileType}. Allowed: ${supportedTypes.join(', ')}`,
    }
  }
  
  return { valid: true }
}
