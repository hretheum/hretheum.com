import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore: any = await (cookies() as any)
    const raw = cookieStore?.get?.('hre_rsrc')?.value || ''
    if (!raw) return NextResponse.json({ skipped: true, reason: 'no_cookie' }, { status: 200 })

    let sourceHost = ''
    let slug = ''
    try {
      const parsed = JSON.parse(decodeURIComponent(raw))
      sourceHost = String(parsed?.h || '')
      slug = String(parsed?.s || '')
    } catch {
      /* ignore parse errors */
    }

    // Clear cookie regardless to avoid duplicate logs
    try {
      const domain = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com'
      const res = NextResponse.json({ ok: true })
      res.cookies.set({ name: 'hre_rsrc', value: '', maxAge: 0, path: '/', domain, httpOnly: false, secure: true, sameSite: 'lax' })
      // Defer insert after header set
      const ua = req.headers.get('user-agent') || ''
      const referer = req.headers.get('referer') || ''
      if (sourceHost && (slug || true)) {
        // best-effort insert (no await block on response)
        ;(async () => {
          try {
            const supabase = getServiceClient()
            await supabase.from('redirect_events').insert({ source_host: sourceHost, dest_slug: slug || '(none)', referer, user_agent: ua })
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.warn('[redirect.log] insert failed', e)
          }
        })()
      }
      return res
    } catch (e) {
      return NextResponse.json({ error: 'cookie_clear_failed' }, { status: 500 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'unexpected' }, { status: 500 })
  }
}
