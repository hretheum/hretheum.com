import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Schema for job posting ingest
const ZJobPostingIngest = z.object({
  brand_slug: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  company: z.string().min(1),
  content: z.string().min(100), // Minimum content length
  requirements: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
  experience_level: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
  salary_range_min: z.number().int().positive().optional(),
  salary_range_max: z.number().int().positive().optional(),
  salary_currency: z.string().default('PLN'),
  posted_date: z.string().date().optional(),
  expires_date: z.string().date().optional(),
  metadata: z.record(z.any()).default({})
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ZJobPostingIngest.parse(body)

    // Verify campaign exists and is active
    const supabase = await createClient()
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('brand_slug, active')
      .eq('brand_slug', validatedData.brand_slug)
      .eq('active', true)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or inactive' },
        { status: 404 }
      )
    }

    // Deactivate any existing active postings for this brand
    await supabase
      .from('job_postings')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('brand_slug', validatedData.brand_slug)
      .eq('is_active', true)

    // Insert new job posting
    const { data: jobPosting, error: insertError } = await supabase
      .from('job_postings')
      .insert({
        ...validatedData,
        posted_date: validatedData.posted_date ? new Date(validatedData.posted_date).toISOString().split('T')[0] : null,
        expires_date: validatedData.expires_date ? new Date(validatedData.expires_date).toISOString().split('T')[0] : null,
        metadata: validatedData.metadata
      })
      .select()
      .single()

    if (insertError) {
      console.error('Job posting insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save job posting' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      job_posting: jobPosting
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Job posting ingest error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get job posting for a brand
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandSlug = searchParams.get('brand_slug')

    if (!brandSlug) {
      return NextResponse.json(
        { error: 'brand_slug parameter required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: jobPosting, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('brand_slug', brandSlug)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Job posting fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch job posting' },
        { status: 500 }
      )
    }

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'No active job posting found for this brand' },
        { status: 404 }
      )
    }

    return NextResponse.json({ job_posting: jobPosting })

  } catch (error) {
    console.error('Job posting API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}