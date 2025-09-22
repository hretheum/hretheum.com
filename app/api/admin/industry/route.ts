import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/utils/supabase/server'

function getSvc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

async function getUserEmail(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  return data.user?.email ?? null
}

function isAllowed(email: string | null): boolean {
  if (!email) return false
  const allow = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  if (allow.length === 0) return false
  return allow.includes(email.toLowerCase())
}

export async function GET(req: NextRequest) {
  try {
    const email = await getUserEmail()
    if (!isAllowed(email)) return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 500)

    const svc = getSvc()
    const { data, error } = await svc
      .from('brand_industries')
      .select('brand_slug, industry, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })

    return NextResponse.json({ items: data || [], limit }, { headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
  } catch (e: any) {
    return NextResponse.json({ error: 'unexpected' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
  }
}
