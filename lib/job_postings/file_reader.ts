// Job Posting File Reader - Step 2
// Reads file content with UTF-8 encoding support

import { promises as fs } from 'fs'

export async function readJobPostingFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    console.log(`[reader] Read file: ${filePath} (${content.length} chars)`)
    return content
  } catch (error: any) {
    console.error(`[reader] Failed to read ${filePath}:`, error.message)
    throw new Error(`Failed to read job posting file: ${error.message}`)
  }
}
