// Job Posting Database Queries - Step 1
// Fetch job postings for a brand from Supabase

import { createClient } from '@supabase/supabase-js'

export interface JobPostingData {
  id: string
  brand_slug: string
  title: string
  content: string
  core_requirements: string[]
  technical_skills: string[]
  soft_skills: string[]
  domain_knowledge: string[]
  culture_signals: string[]
  responsibilities: string[]
  seniority_level: string
  role_type: string
  created_at: string
}

export async function getJobPostingsForBrand(
  brand_slug: string,
  limit: number = 5
): Promise<JobPostingData[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  console.log(`[queries] Fetching job postings for brand: ${brand_slug}`)
  
  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .eq('brand_slug', brand_slug)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error(`[queries] Failed to fetch job postings for ${brand_slug}:`, error.message)
    return []
  }
  
  console.log(`[queries] Found ${data?.length || 0} job posting(s) for ${brand_slug}`)
  
  return data || []
}

export async function hasJobPostings(brand_slug: string): Promise<boolean> {
  const postings = await getJobPostingsForBrand(brand_slug, 1)
  return postings.length > 0
}
