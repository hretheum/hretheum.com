/**
 * PUT /api/admin/campaigns/:slug/visibility
 * 
 * Phase 2.A: Toggle campaign visibility (visible/hidden)
 * Updates campaigns table in Supabase, revalidates cache
 * 
 * Admin-only endpoint (requires ADMIN_EMAILS check)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface RouteContext {
  params: Promise<{ slug: string }>
}

function isAllowed(email: string | null): boolean {
  if (!email) return false
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes(email.toLowerCase())
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const email = userData.user?.email ?? null

    if (!isAllowed(email)) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      )
    }

    // 2. Get slug from params
    const { slug } = await context.params
    if (!slug) {
      return NextResponse.json(
        { error: 'Campaign slug is required' },
        { status: 400 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { visible } = body

    if (typeof visible !== 'boolean') {
      return NextResponse.json(
        { error: 'visible must be a boolean' },
        { status: 400 }
      )
    }

    // 4. Update campaign visibility in Supabase
    const { data, error } = await supabase
      .from('campaigns')
      .update({ 
        visible,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug)
      .select()
      .single()

    if (error) {
      console.error('Failed to update campaign visibility:', error)
      return NextResponse.json(
        { error: 'Failed to update campaign', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // 5. Revalidate cache for brand page
    const brandSlug = data.brand_slug
    if (brandSlug) {
      try {
        revalidatePath(`/brand/${brandSlug}`)
        revalidatePath('/admin') // Refresh admin list
      } catch (err) {
        console.warn('Failed to revalidate cache:', err)
        // Non-critical error, continue
      }
    }

    // 6. Return success
    return NextResponse.json({
      success: true,
      data: {
        slug: data.slug,
        brand_slug: data.brand_slug,
        visible: data.visible,
        updated_at: data.updated_at
      },
      message: visible 
        ? 'Campaign is now visible' 
        : 'Campaign is now hidden'
    })

  } catch (err) {
    console.error('Error in visibility endpoint:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Disallow other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use PUT to toggle visibility.' },
    { status: 405 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use PUT to toggle visibility.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use PUT to toggle visibility.' },
    { status: 405 }
  )
}
