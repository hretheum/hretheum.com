import { resolveIndustry as resolveDeterministic, type Industry } from '@/lib/industry'
import { getOpenAIClient } from '@/lib/llm'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getSvc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}
function getAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

const INDUSTRIES: Industry[] = ['SaaS','Pharma','FinTech','Commerce','Manufacturing','Public','Generic']

async function classifyIndustryLLM(slug: string, timeoutMs = 1500): Promise<{ industry: Industry; confidence: number } | null> {
  try {
    const client = getOpenAIClient()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.max(500, timeoutMs))
    const sys = `You classify company brands into one of these industries: ${INDUSTRIES.slice(0, -1).join(', ')}. Respond ONLY JSON: {"industry":"<one>", "confidence":<0..1>}. Use brand name context only; do not hallucinate logos/claims. If uncertain, pick the closest.`
    const user = `brand: ${slug}`
    const res = await client.chat.completions.create({
      model: process.env.AI_MODEL_GENERATION || 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    }, { signal: controller.signal as any })
    clearTimeout(timer)
    const txt = res.choices?.[0]?.message?.content || ''
    const parsed = JSON.parse(txt)
    let ind = String(parsed?.industry || '').trim()
    let conf = Number(parsed?.confidence)
    if (!Number.isFinite(conf)) conf = 0
    const norm = (v: string): Industry => {
      const m: Record<string, Industry> = {
        'saas':'SaaS','software':'SaaS','pharma':'Pharma','pharmaceutical':'Pharma','fintech':'FinTech','finance':'FinTech','banking':'FinTech','commerce':'Commerce','retail':'Commerce','manufacturing':'Manufacturing','public':'Public','government':'Public'
      }
      const k = v.toLowerCase()
      return (m[k] || (INDUSTRIES.includes(v as Industry) ? v as Industry : 'Generic'))
    }
    const industry = norm(ind)
    return { industry, confidence: Math.max(0, Math.min(1, conf)) }
  } catch {
    return null
  }
}

async function fetchIndustryFromDB(slug: string): Promise<Industry | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
    const anon = getAnon()
    const { data, error } = await anon.from('brand_industries').select('industry').eq('brand_slug', slug).maybeSingle()
    if (error) return null
    const ind = String(data?.industry || '') as Industry
    return (INDUSTRIES.includes(ind) ? ind : null)
  } catch { return null }
}

async function autopromote(slug: string, industry: Industry, confidence: number) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    const svc = getSvc()
    await svc.from('brand_industries').upsert({ brand_slug: slug, industry, status: 'auto', updated_by: 'llm', note: JSON.stringify({ confidence }) })
    // optional: store suggestion
    try {
      await svc.from('brand_industry_suggestions').insert({ brand_slug: slug, industry, confidence, source: 'llm', expires_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString() })
    } catch {}
  } catch {}
}

export async function resolveIndustrySSR(slug: string): Promise<Industry> {
  const s = (slug || '').trim().toLowerCase()
  if (!s) return 'Generic'
  // 1) Deterministic mapping file
  const det = resolveDeterministic(s)
  if (det && det !== 'Generic') {
    try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'deterministic', industry: det }) } catch {}
    return det
  }
  // 2) DB mapping (auto/manual/locked)
  const fromDb = await fetchIndustryFromDB(s)
  if (fromDb) {
    try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'db', industry: fromDb }) } catch {}
    return fromDb
  }
  // 3) Runtime LLM (guarded)
  const enabled = String(process.env.INDUSTRY_AUTOPROMOTE_ENABLED || 'true').toLowerCase() !== 'false'
  const minConf = Math.max(0, Math.min(1, Number(process.env.INDUSTRY_AUTOPROMOTE_MIN_CONF || '0.8')))
  const res = await classifyIndustryLLM(s)
  if (res && res.industry !== 'Generic') {
    if (enabled && res.confidence >= minConf) {
      await autopromote(s, res.industry, res.confidence)
      try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'llm_auto', industry: res.industry, confidence: res.confidence }) } catch {}
      return res.industry
    }
    try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'llm', industry: res.industry, confidence: res.confidence }) } catch {}
    return res.industry
  }
  try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'generic', industry: 'Generic' }) } catch {}
  return 'Generic'
}
