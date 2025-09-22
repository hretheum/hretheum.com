export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { resolveIndustrySSR } from '@/lib/industry_server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret') || req.headers.get('x-admin-secret') || ''
    const expected = process.env.INDUSTRY_DEBUG_SECRET || ''
    if (!expected || secret !== expected) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
    }
    const slug = (url.searchParams.get('slug') || '').trim().toLowerCase()
    if (!slug) return NextResponse.json({ ok: false, error: 'missing slug' }, { status: 400 })

    const result = await resolveIndustrySSR(slug)

    const meta = {
      hasGatewayKey: Boolean(process.env.AI_GATEWAY_API_KEY),
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      hasSvcKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      timeout: Number(process.env.INDUSTRY_LLM_TIMEOUT_MS || 5000),
      autopromoteEnabled: String(process.env.INDUSTRY_AUTOPROMOTE_ENABLED || 'true') !== 'false',
      minConf: Number(process.env.INDUSTRY_AUTOPROMOTE_MIN_CONF || 0.8),
      log: process.env.INDUSTRY_LOG || '',
    }

    return NextResponse.json({ ok: true, result, meta })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'error' }, { status: 500 })
  }
}
