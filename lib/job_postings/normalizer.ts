// Job Posting Content Normalizer - Step 3
// Cleans and standardizes file content

export interface NormalizedContent {
  original: string
  normalized: string
  encoding: string
  lineBreaks: 'unix' | 'windows' | 'mixed'
  stats: {
    originalLength: number
    normalizedLength: number
    linesRemoved: number
    whitespaceReduced: number
  }
}

export function normalizeContent(content: string): NormalizedContent {
  const original = content
  const originalLength = content.length
  
  // Step 1: Decode HTML entities
  let normalized = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Step 2: Detect line break style (before normalization)
  const hasWindows = normalized.includes('\r\n')
  // Check for Unix-only newlines (not part of \r\n)
  const normalizedTemp = normalized.replace(/\r\n/g, '')
  const hasUnixOnly = normalizedTemp.includes('\n')
  const lineBreaks = hasWindows && hasUnixOnly ? 'mixed' : hasWindows ? 'windows' : 'unix'
  
  // Step 3: Normalize line breaks to \n
  normalized = normalized.replace(/\r\n/g, '\n')
  
  // Step 4: Remove excessive whitespace
  const beforeWhitespace = normalized.length
  normalized = normalized
    .replace(/[ \t]+/g, ' ')           // Multiple spaces/tabs → single space
    .replace(/\n{3,}/g, '\n\n')        // Max 2 consecutive newlines
    .replace(/^\s+/gm, '')             // Remove leading whitespace per line
    .replace(/\s+$/gm, '')             // Remove trailing whitespace per line
  const whitespaceReduced = beforeWhitespace - normalized.length
  
  // Step 5: Remove non-printable characters (except \n, \t)
  normalized = normalized.replace(/[^\x20-\x7E\n\t\u0080-\uFFFF]/g, '')
  
  // Step 6: Trim overall
  normalized = normalized.trim()
  
  const normalizedLength = normalized.length
  const linesRemoved = (original.match(/\n/g) || []).length - (normalized.match(/\n/g) || []).length
  
  console.log(`[normalizer] Original: ${originalLength} chars, Normalized: ${normalizedLength} chars`)
  console.log(`[normalizer] Removed ${linesRemoved} lines, reduced ${whitespaceReduced} whitespace chars`)
  
  return {
    original,
    normalized,
    encoding: 'utf-8',
    lineBreaks,
    stats: {
      originalLength,
      normalizedLength,
      linesRemoved,
      whitespaceReduced,
    }
  }
}
