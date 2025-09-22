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

export async function POST(req: NextRequest) {
  try {
    const email = await getUserEmail()
    if (!isAllowed(email)) return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
    const body = await req.json().catch(() => ({}))
    const brand_slug = String(body?.brand_slug || '').trim().toLowerCase()
    if (!brand_slug) return NextResponse.json({ error: 'invalid_brand' }, { status: 400, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })

    const svc = getSvc()
    const { data, error } = await svc.from('brand_industries').select('industry').eq('brand_slug', brand_slug).maybeSingle()
    if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })

    const { error: upErr } = await svc.from('brand_industries').upsert({ brand_slug, industry: data.industry, status: 'locked', updated_by: email || 'admin' })
    if (upErr) return NextResponse.json({ error: 'update_failed' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })

    return NextResponse.json({ ok: true }, { headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
  } catch (e: any) {
    return NextResponse.json({ error: 'unexpected' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
  }
}
