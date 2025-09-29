// Job Posting Metadata Extractor - Step 4
// Extracts brand_slug and timestamp from filename

import path from 'path'

export interface FileMetadata {
  brand_slug: string
  timestamp: Date
  filename: string
  format: 'md' | 'txt' | 'json'
  valid: boolean
  error?: string
}

export function extractFileMetadata(filename: string): FileMetadata {
  const ext = path.extname(filename).slice(1) as 'md' | 'txt' | 'json'
  const basename = path.basename(filename, path.extname(filename))
  
  // Expected format: {brand_slug}-{timestamp}
  // Example: tmobile-20250129T143022Z
  const match = basename.match(/^([a-z0-9-]+)-(\d{8}T\d{6}Z)$/)
  
  if (!match) {
    return {
      brand_slug: '',
      timestamp: new Date(),
      filename,
      format: ext,
      valid: false,
      error: `Invalid filename format. Expected: {brand_slug}-{timestamp}.${ext}`
    }
  }
  
  const [, brand_slug, timestampStr] = match
  
  // Parse ISO 8601 timestamp: 20250129T143022Z → 2025-01-29T14:30:22Z
  const year = timestampStr.slice(0, 4)
  const month = timestampStr.slice(4, 6)
  const day = timestampStr.slice(6, 8)
  const hour = timestampStr.slice(9, 11)
  const minute = timestampStr.slice(11, 13)
  const second = timestampStr.slice(13, 15)
  
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
  const timestamp = new Date(isoString)
  
  if (isNaN(timestamp.getTime())) {
    return {
      brand_slug,
      timestamp: new Date(),
      filename,
      format: ext,
      valid: false,
      error: `Invalid timestamp: ${timestampStr}`
    }
  }
  
  console.log(`[metadata] Extracted: brand=${brand_slug}, timestamp=${timestamp.toISOString()}`)
  
  return {
    brand_slug,
    timestamp,
    filename,
    format: ext,
    valid: true
  }
}
