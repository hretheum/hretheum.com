import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const APEX = (process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com').toLowerCase()
const DRAIN_TOKEN = process.env.VERCEL_DRAIN_TOKEN || ''

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

function extractHost(rec: any): string | null {
  // Try common fields; drains may send different shapes depending on product
  const candidates = [
    rec?.host,
    rec?.hostname,
    rec?.requestHost,
    rec?.request?.host,
    rec?.req?.headers?.host,
    rec?.http?.host,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c.toLowerCase()
  }
  return null
}

function extractStatus(rec: any): number | null {
  const candidates = [rec?.status, rec?.statusCode, rec?.code, rec?.response?.status]
  for (const c of candidates) {
    if (typeof c === 'number' && isFinite(c)) return c
    if (typeof c === 'string' && /^\d{3}$/.test(c)) return parseInt(c, 10)
  }
  return null
}

function extractMethod(rec: any): string | null {
  const candidates = [rec?.method, rec?.httpMethod, rec?.request?.method]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return null
}

function extractPath(rec: any): string | null {
  const candidates = [rec?.path, rec?.url, rec?.requestPath, rec?.request?.path]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return null
}

function extractUA(rec: any): string | null {
  const candidates = [rec?.userAgent, rec?.user_agent, rec?.ua, rec?.request?.headers?.['user-agent']]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    if (!DRAIN_TOKEN) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    if (token !== DRAIN_TOKEN) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    const records: any[] = Array.isArray(body) ? body : [body]
    const rows: { host: string; status: number; method: string | null; path: string | null; user_agent: string | null; created_at?: string }[] = []

    for (const rec of records) {
      const host = extractHost(rec)
      const status = extractStatus(rec)
      if (!host || status == null) continue
      // only hosts under apex, and with at least one label before apex
      if (!host.endsWith('.' + APEX)) continue
      const parts = host.split('.')
      const apexParts = APEX.split('.')
      if (parts.length <= apexParts.length) continue
      const method = extractMethod(rec)
      const path = extractPath(rec)
      const ua = extractUA(rec)
      rows.push({ host, status, method, path, user_agent: ua })
    }

    if (rows.length > 0) {
      const svc = getServiceClient()
      const { error } = await svc.from('vercel_drain_events').insert(rows)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[vercel_drain] insert failed:', error.message || error)
        // accept but report partial failure
        return NextResponse.json({ ingested: 0, skipped: rows.length }, { status: 202 })
      }
      return NextResponse.json({ ingested: rows.length }, { status: 200 })
    }

    return NextResponse.json({ ingested: 0 }, { status: 200 })
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') console.error('[vercel_drain] unexpected:', e?.message || e)
    return NextResponse.json({ error: 'unexpected' }, { status: 500 })
  }
}
