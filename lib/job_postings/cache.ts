// Job Posting Cache Invalidation - Step 8
// Invalidates suggestion cache for a brand when new job posting is added

import { createClient } from '@supabase/supabase-js'

export async function invalidateBrandCache(brand_slug: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  
  try {
    console.log(`[cache] Invalidating cache for brand: ${brand_slug}`)
    
    // Clear cache_key and cache_expires_at for this brand
    const { error } = await supabase
      .from('job_postings')
      .update({
        cache_key: null,
        cache_expires_at: null
      })
      .eq('brand_slug', brand_slug)
    
    if (error) {
      console.error(`[cache] Failed to invalidate cache for ${brand_slug}:`, error.message)
      throw error
    }
    
    console.log(`[cache] ✅ Cache invalidated for brand: ${brand_slug}`)
  } catch (error: any) {
    console.error(`[cache] Unexpected error:`, error.message)
    // Don't throw - cache invalidation failure shouldn't break the pipeline
  }
}
