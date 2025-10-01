import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Parse query params
    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'updated_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build query (Phase 2.A: use 'visible' instead of 'active')
    let query = supabase
      .from('campaigns')
      .select('brand_slug, mdx_slug, slug, industry, visible, role, location, created_at, updated_at', { count: 'exact' })

    // Apply filters
    if (industry) {
      query = query.eq('industry', industry)
    }
    // Phase 2.A: status filter maps to 'visible' field
    if (status === 'visible' || status === 'active') {
      query = query.eq('visible', true)
    } else if (status === 'hidden' || status === 'inactive') {
      query = query.eq('visible', false)
    }
    if (search) {
      query = query.ilike('brand_slug', `%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('[campaigns/list] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })
  } catch (error: any) {
    console.error('[campaigns/list] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
