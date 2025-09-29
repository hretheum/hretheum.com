// Suggestion Cache Layer - Step 5
// Cache suggestions to avoid repeated LLM calls

import { createClient } from '@supabase/supabase-js'
import type { GeneratedSuggestions } from './suggestion_generator'

export interface CachedSuggestions extends GeneratedSuggestions {
  cache_key: string
  expires_at: Date
  hit_count: number
}

export async function getCachedSuggestions(
  brand_slug: string,
  context_hash: string
): Promise<CachedSuggestions | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const cache_key = `suggestions:${brand_slug}:${context_hash}`
  
  const { data, error } = await supabase
    .from('suggestion_cache')
    .select('*')
    .eq('cache_key', cache_key)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !data) {
    console.log(`[cache] Cache miss for ${cache_key}`)
    return null
  }
  
  // Increment hit count
  await supabase
    .from('suggestion_cache')
    .update({ 
      hit_count: data.hit_count + 1,
      last_accessed: new Date().toISOString()
    })
    .eq('cache_key', cache_key)
  
  console.log(`[cache] Cache hit for ${cache_key} (hits: ${data.hit_count + 1})`)
  
  return {
    suggestions: data.suggestions,
    context_hash: data.context_hash,
    generated_at: new Date(data.generated_at),
    model: data.model,
    cache_key: data.cache_key,
    expires_at: new Date(data.expires_at),
    hit_count: data.hit_count,
  }
}

export async function setCachedSuggestions(
  brand_slug: string,
  suggestions: GeneratedSuggestions,
  ttl_hours: number = 24
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const cache_key = `suggestions:${brand_slug}:${suggestions.context_hash}`
  const expires_at = new Date(Date.now() + ttl_hours * 60 * 60 * 1000)
  
  const { error } = await supabase
    .from('suggestion_cache')
    .upsert({
      cache_key,
      brand_slug,
      context_hash: suggestions.context_hash,
      suggestions: suggestions.suggestions,
      model: suggestions.model,
      generated_at: suggestions.generated_at.toISOString(),
      expires_at: expires_at.toISOString(),
      hit_count: 0,
      last_accessed: new Date().toISOString(),
    })
  
  if (error) {
    console.error(`[cache] Failed to cache suggestions:`, error.message)
  } else {
    console.log(`[cache] Cached suggestions for ${cache_key} (expires: ${expires_at.toISOString()})`)
  }
}

export async function invalidateBrandSuggestionCache(brand_slug: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { error } = await supabase
    .from('suggestion_cache')
    .delete()
    .eq('brand_slug', brand_slug)
  
  if (error) {
    console.error(`[cache] Failed to invalidate cache for ${brand_slug}:`, error.message)
  } else {
    console.log(`[cache] Invalidated all suggestion cache for ${brand_slug}`)
  }
}