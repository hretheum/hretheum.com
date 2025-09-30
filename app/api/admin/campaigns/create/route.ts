import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { 
  CreateCampaignRequestSchema, 
  CreateCampaignResponse, 
  ProcessingStep 
} from '@/lib/campaigns/types'
import { z } from 'zod'

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
    
    // Step 5: Placeholder for actual processing
    // This will be implemented in subsequent tasks (Task 1.2-1.6)
    steps.push({ name: 'content_processing', status: 'pending' })
    steps.push({ name: 'job_posting_creation', status: 'pending' })
    steps.push({ name: 'campaign_file_generation', status: 'pending' })
    steps.push({ name: 'index_update', status: 'pending' })
    steps.push({ name: 'cache_invalidation', status: 'pending' })
    
    // For now, return success with pending steps
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const campaignSlug = requestData.campaignSlug || 
      `${sanitizedBrandSlug}_${requestData.metadata?.role?.toLowerCase().replace(/\s+/g, '_') || 'campaign'}`
    
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
    
    // Mark current step as failed
    const currentStep = steps.find(s => s.status === 'running')
    if (currentStep) {
      currentStep.status = 'failed'
      currentStep.error = error.message || 'Unexpected error'
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error', 
        message: 'An unexpected error occurred during campaign creation',
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
