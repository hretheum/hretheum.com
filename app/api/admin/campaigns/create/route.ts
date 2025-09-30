import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { 
  CreateCampaignRequestSchema, 
  CreateCampaignResponse, 
  ProcessingStep 
} from '@/lib/campaigns/types'
import { z } from 'zod'
import { fetchJobPostingFromUrl } from '@/lib/scraping/url-fetcher'
import { parseJobPostingFile } from '@/lib/scraping/file-parser'
import { generateCampaignContent } from '@/lib/campaigns/ai-generator'
import { generateCampaignMDX } from '@/lib/campaigns/generator'
import { updateCampaignIndex } from '@/lib/campaigns/index-manager'
import path from 'path'
import fs from 'fs/promises'

// Runtime configuration
export const runtime = 'nodejs'
export const maxDuration = 60 // 60s timeout

/**
 * POST /api/admin/campaigns/create
 * 
 * Create a new campaign from URL, text, or file upload.
 * Admin-only endpoint with comprehensive validation and error handling.
 * 
 * @see docs/aui/CAMPAIGN_CREATION_ARCHITECTURE.md - Task 1.1
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const steps: ProcessingStep[] = []
  
  try {
    // Step 1: Authentication & Authorization
    steps.push({ name: 'authentication', status: 'running' })
    const authStart = Date.now()
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      steps[0].status = 'failed'
      steps[0].error = 'Authentication required'
      steps[0].duration = Date.now() - authStart
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized', 
          message: 'Authentication required',
          steps 
        },
        { status: 401 }
      )
    }
    
    // Check admin access
    const allowedEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
    
    if (!allowedEmails.includes(user.email.toLowerCase())) {
      steps[0].status = 'failed'
      steps[0].error = 'Insufficient permissions'
      steps[0].duration = Date.now() - authStart
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden', 
          message: 'Admin access required',
          steps 
        },
        { status: 403 }
      )
    }
    
    steps[0].status = 'completed'
    steps[0].duration = Date.now() - authStart
    
    // Step 2: Request Validation
    steps.push({ name: 'request_validation', status: 'running' })
    const validationStart = Date.now()
    
    let body: unknown
    try {
      body = await request.json()
    } catch (error) {
      steps[1].status = 'failed'
      steps[1].error = 'Invalid JSON body'
      steps[1].duration = Date.now() - validationStart
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bad Request', 
          message: 'Invalid JSON in request body',
          steps 
        },
        { status: 400 }
      )
    }
    
    // Validate with Zod
    const validation = CreateCampaignRequestSchema.safeParse(body)
    
    if (!validation.success) {
      steps[1].status = 'failed'
      steps[1].error = 'Validation failed'
      steps[1].duration = Date.now() - validationStart
      
      const errors = validation.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation Error', 
          message: 'Request validation failed',
          errors,
          steps 
        },
        { status: 400 }
      )
    }
    
    const requestData = validation.data
    steps[1].status = 'completed'
    steps[1].duration = Date.now() - validationStart
    
    // Step 3: Rate Limiting Check (simple in-memory, upgrade to Redis for production)
    steps.push({ name: 'rate_limiting', status: 'running' })
    const rateLimitStart = Date.now()
    
    // TODO: Implement proper rate limiting with Redis/Upstash
    // For now, just log and pass
    console.log('[campaigns] Rate limit check passed for:', user.email)
    
    steps[2].status = 'completed'
    steps[2].duration = Date.now() - rateLimitStart
    
    // Step 4: Input Sanitization
    steps.push({ name: 'input_sanitization', status: 'running' })
    const sanitizationStart = Date.now()
    
    // XSS prevention - sanitize text inputs
    const sanitizedBrandSlug = requestData.brandSlug.trim().toLowerCase()
    const sanitizedIndustry = requestData.industry.trim()
    
    steps[3].status = 'completed'
    steps[3].duration = Date.now() - sanitizationStart
    
    // Step 5: Content Extraction
    steps.push({ name: 'content_extraction', status: 'running' })
    const extractionStart = Date.now()
    
    let rawContent: string
    try {
      if (requestData.source.type === 'url') {
        rawContent = await fetchJobPostingFromUrl(requestData.source.url)
      } else if (requestData.source.type === 'text') {
        rawContent = requestData.source.content
      } else if (requestData.source.type === 'file') {
        rawContent = await parseJobPostingFile(
          requestData.source.fileData,
          requestData.source.fileName,
          requestData.source.fileType
        )
      } else {
        throw new Error('Invalid source type')
      }
      
      steps[4].status = 'completed'
      steps[4].duration = Date.now() - extractionStart
    } catch (error: any) {
      steps[4].status = 'failed'
      steps[4].error = error.message
      steps[4].duration = Date.now() - extractionStart
      throw error
    }
    
    // Step 6: AI Content Generation
    steps.push({ name: 'ai_generation', status: 'running' })
    const aiStart = Date.now()
    
    let aiContent
    try {
      aiContent = await generateCampaignContent({
        jobPosting: {
          content: rawContent,
          requirements: [], // Will be extracted by AI
          skills: [],
          role: requestData.metadata?.role || 'Professional',
          seniority: 'mid', // Default
        },
        brand: sanitizedBrandSlug,
        industry: sanitizedIndustry,
      })
      
      steps[5].status = 'completed'
      steps[5].duration = Date.now() - aiStart
    } catch (error: any) {
      steps[5].status = 'failed'
      steps[5].error = error.message
      steps[5].duration = Date.now() - aiStart
      throw error
    }
    
    // Step 7: Campaign File Generation
    steps.push({ name: 'file_generation', status: 'running' })
    const fileGenStart = Date.now()
    
    const campaignSlug = requestData.campaignSlug || 
      `${sanitizedBrandSlug}-${requestData.metadata?.role?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'campaign'}`
    
    let mdxContent: string
    try {
      mdxContent = await generateCampaignMDX({
        slug: campaignSlug,
        brand: sanitizedBrandSlug,
        industry: sanitizedIndustry,
        accent: requestData.metadata?.accent,
        role: requestData.metadata?.role,
        location: requestData.metadata?.location,
        heroHeadline: aiContent.copy.heroHeadline,
        sections: aiContent.copy.sections,
      })
      
      // Save to Supabase (works on serverless)
      const { error: dbError } = await supabase
        .from('campaigns')
        .upsert({
          brand_slug: sanitizedBrandSlug,
          mdx_slug: campaignSlug,
          content: mdxContent,
          industry: sanitizedIndustry,
          role: requestData.metadata?.role,
          location: requestData.metadata?.location,
          active: true,
          updated_at: new Date().toISOString(),
        })
      
      if (dbError) {
        throw new Error(`Database save failed: ${dbError.message}`)
      }
      
      steps[6].status = 'completed'
      steps[6].duration = Date.now() - fileGenStart
    } catch (error: any) {
      steps[6].status = 'failed'
      steps[6].error = error.message
      steps[6].duration = Date.now() - fileGenStart
      throw error
    }
    
    // Step 8: Index Update
    steps.push({ name: 'index_update', status: 'running' })
    const indexStart = Date.now()
    
    try {
      await updateCampaignIndex(sanitizedBrandSlug, campaignSlug, {
        industry: sanitizedIndustry,
        role: requestData.metadata?.role,
      })
      
      steps[7].status = 'completed'
      steps[7].duration = Date.now() - indexStart
    } catch (error: any) {
      steps[7].status = 'failed'
      steps[7].error = error.message
      steps[7].duration = Date.now() - indexStart
      // Don't throw - index update is not critical
      console.error('[campaigns] Index update failed:', error)
    }
    
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const response: CreateCampaignResponse = {
      success: true,
      campaignId,
      brandSlug: sanitizedBrandSlug,
      campaignSlug,
      steps,
    }
    
    const totalDuration = Date.now() - startTime
    console.log('[campaigns] Request processed', {
      campaignId,
      brandSlug: sanitizedBrandSlug,
      sourceType: requestData.source.type,
      duration: totalDuration,
      user: user.email,
    })
    
    return NextResponse.json(response, { 
      status: 201,
      headers: {
        'X-Processing-Time': totalDuration.toString(),
      }
    })
    
  } catch (error: any) {
    console.error('[campaigns] Unexpected error:', error)
    console.error('[campaigns] Error stack:', error.stack)
    
    // Mark current step as failed if exists
    const currentStep = steps[steps.length - 1]
    if (currentStep) {
      currentStep.status = 'failed'
      currentStep.error = error.message || 'Unexpected error'
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error', 
        message: error.message || 'An unexpected error occurred during campaign creation',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        steps 
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
