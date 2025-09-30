import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const { content, active } = await request.json()

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    // Use service role to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    )

    const updateData: any = { updated_at: new Date().toISOString() }
    if (content !== undefined) updateData.content = content
    if (active !== undefined) updateData.active = active

    const { data, error } = await serviceSupabase
      .from('campaigns')
      .update(updateData)
      .eq('brand_slug', slug)
      .select()
      .single()

    if (error) {
      console.error('[campaigns/update] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[campaigns/update] Updated:', { slug, contentLength: content?.length })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[campaigns/update] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const { createClient: createAnonClient } = await import('@supabase/supabase-js')
    const supabase = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('brand_slug', slug)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[campaigns/get] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
