import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recommendAiAction } from '@/lib/rules/ai/aiPolicy'

// Reuse a very similar origin policy as RAG route
function pickAllowedOrigin(origin: string) {
  try {
    const u = new URL(origin)
    const host = (u.hostname || '').toLowerCase()
    if (!host) return ''
    if (host === 'hretheum.com' || host.endsWith('.hretheum.com')) return `${u.protocol}//${u.host}`
    if (host === 'localhost' || host === '127.0.0.1') return `${u.protocol}//${u.host}`
    const extra = (process.env.CORS_EXTRA_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (extra.includes(`${u.protocol}//${u.host}`)) return `${u.protocol}//${u.host}`
    return ''
  } catch {
    return ''
  }
}

function buildCorsHeaders(allowOrigin: string): Record<string, string> {
  const h: Record<string, string> = { Vary: 'Origin' }
  if (allowOrigin) h['Access-Control-Allow-Origin'] = allowOrigin
  return h
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || ''
  const allowOrigin = pickAllowedOrigin(origin)
  const headers: Record<string, string> = {
    ...buildCorsHeaders(allowOrigin),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  }
  return new NextResponse(null, { status: 204, headers })
}

const IncomingSummarySchema = z.object({
  // directly matches SessionSummary fields used by the policy layer
  route: z.string(),
  brand: z.string().optional(),
  industry: z
    .enum(['SaaS', 'Pharma', 'FinTech', 'Commerce', 'Manufacturing', 'Public', 'eLearning', 'Telecom', 'Generic'])
    .optional(),
  consent: z.boolean().default(false),
  device: z.enum(['desktop', 'mobile', 'unknown']).default('unknown'),
  engagement: z
    .object({
      dwell_ms: z.number().optional(),
      scroll: z.object({ depth_bucket: z.number().optional(), velocity_bucket: z.number().optional() }).optional(),
      hesitation_ms: z.number().optional(),
      rage_clicks: z.number().optional(),
      dead_clicks: z.number().optional(),
      cta_clicks: z.record(z.number()).optional(),
    })
    .optional(),
  rag: z.object({ intent: z.string().optional(), confidence: z.number().min(0).max(1).optional(), lowConfidence: z.boolean().optional() }).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const t0 = Date.now()
    const origin = req.headers.get('origin') || ''
    const allowOrigin = pickAllowedOrigin(origin)
    const corsHeaders = buildCorsHeaders(allowOrigin)

    let body: any = null
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders })
    }

    const parsed = IncomingSummarySchema.safeParse(body?.summary || body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid summary', issues: parsed.error.issues }, { status: 400, headers: corsHeaders })
    }
    const summary = parsed.data as any

    const modeShadow = String(process.env.RULES_AI_SHADOW_ONLY ?? 'true').toLowerCase() === 'true'

    const rec = await recommendAiAction({
      ts: Date.now(),
      session_id: undefined,
      ...summary,
    } as any)

    const payload = {
      source: 'ai' as const,
      mode: modeShadow ? 'shadow' : 'active',
      allowed_actions: (process.env.RULES_AI_ALLOWED_ACTIONS || 'ui.show_suggestions,ui.tooltip,ui.show_how_it_works')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      // when rec is null (disabled, no consent, sampling miss, timeout, etc.)
      action: rec?.recommended_action || null,
      confidence: rec?.confidence ?? 0,
      intent_summary: rec?.intent_summary || undefined,
      total_ms: Date.now() - t0,
    }

    return NextResponse.json(payload, { headers: corsHeaders })
  } catch (err: any) {
    const origin = (err as any)?.origin || ''
    const corsHeaders = buildCorsHeaders(pickAllowedOrigin(origin))
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500, headers: corsHeaders })
  }
}
