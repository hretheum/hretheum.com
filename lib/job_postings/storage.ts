// Job Posting Storage - Step 7
// Stores processed job postings in Supabase

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import type { FileMetadata } from './metadata'
import type { NormalizedContent } from './normalizer'
import type { ExtractedData } from './extractor'
import type { EmbeddingResult } from './embeddings'

export interface StorageResult {
  id: string
  success: boolean
  error?: string
}

export async function storeJobPosting(
  metadata: FileMetadata,
  normalized: NormalizedContent,
  extracted: ExtractedData,
  embeddings: EmbeddingResult
): Promise<StorageResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  
  try {
    // Generate content hash for deduplication
    const contentHash = crypto
      .createHash('sha256')
      .update(normalized.normalized)
      .digest('hex')
    
    console.log(`[storage] Storing job posting for brand: ${metadata.brand_slug}`)
    console.log(`[storage] Content hash: ${contentHash.slice(0, 16)}...`)
    
    const { data, error } = await supabase
      .from('job_postings')
      .insert({
        brand_slug: metadata.brand_slug,
        title: `Job Posting - ${metadata.brand_slug}`,
        company: metadata.brand_slug,
        content: normalized.normalized,
        is_active: true,
        
        // File metadata
        raw_content: normalized.original,
        normalized_content: normalized.normalized,
        file_path: metadata.filename,
        file_format: metadata.format,
        content_hash: contentHash,
        
        // Extracted semantic data (JSONB)
        core_requirements: extracted.core_requirements,
        technical_skills: extracted.technical_skills,
        soft_skills: extracted.soft_skills,
        domain_knowledge: extracted.domain_knowledge,
        culture_signals: extracted.culture_signals,
        responsibilities: extracted.responsibilities,
        seniority_level: extracted.seniority_level,
        role_type: extracted.role_type,
        
        // Embeddings (pgvector will handle the array conversion)
        embedding_full_text: JSON.stringify(embeddings.full_text),
        embedding_requirements: JSON.stringify(embeddings.requirements),
        embedding_skills: JSON.stringify(embeddings.skills),
        embedding_model: embeddings.model,
        
        // Cache management
        cache_key: `job_postings:${metadata.brand_slug}`,
        cache_expires_at: null, // Will be set by Step 8
        
        // Timestamps
        processed_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    
    if (error) {
      console.error(`[storage] Failed to store job posting:`, error.message)
      
      // Check if it's a duplicate content error
      if (error.message.includes('duplicate') || error.code === '23505') {
        return { 
          id: '', 
          success: false, 
          error: `Duplicate content detected (hash: ${contentHash.slice(0, 16)}...)` 
        }
      }
      
      return { id: '', success: false, error: error.message }
    }
    
    console.log(`[storage] ✅ Successfully stored job posting: ${data.id}`)
    return { id: data.id, success: true }
    
  } catch (error: any) {
    console.error(`[storage] Unexpected error:`, error.message)
    return { id: '', success: false, error: error.message }
  }
}
