import { resolveIndustry as resolveDeterministic, type Industry, getAllowedIndustries, isAllowedIndustry } from '@/lib/industry'
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

const ALLOWED: Industry[] = getAllowedIndustries()
const NON_GENERIC = ALLOWED.filter((x) => String(x).toLowerCase() !== 'generic')

export type IndustrySource = 'deterministic' | 'db' | 'llm' | 'llm_auto' | 'generic'
export type SSRIndustryResult = { industry: Industry; source: IndustrySource }

async function classifyIndustryLLM(slug: string, timeoutMs?: number): Promise<{ industry: Industry; confidence: number } | null> {
  try {
    const client = getOpenAIClient()
    const controller = new AbortController()
    const requested = Number(timeoutMs ?? process.env.INDUSTRY_LLM_TIMEOUT_MS ?? 5000)
    const effTimeout = Number.isFinite(requested) ? Math.max(500, requested) : 5000
    const timer = setTimeout(() => controller.abort(), effTimeout)
    const sys = `Classify the company brand into one of these industries: ${NON_GENERIC.join(', ')}. Respond ONLY JSON: {"industry":"<one>", "confidence":<0..1>}. Use brand name context only; do not hallucinate logos/claims. If uncertain, pick the closest from the list.`
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
        'saas':'SaaS','software':'SaaS',
        'pharma':'Pharma','pharmaceutical':'Pharma',
        'fintech':'FinTech','finance':'FinTech','banking':'FinTech',
        'commerce':'Commerce','retail':'Commerce',
        'manufacturing':'Manufacturing',
        'public':'Public','government':'Public','gov':'Public',
        'elearning':'eLearning','edtech':'eLearning','education':'eLearning'
      }
      const k = v.toLowerCase()
      const viaSyn = m[k]
      if (viaSyn && isAllowedIndustry(viaSyn)) return viaSyn
      // exact case-insensitive hit in allowed
      const hit = ALLOWED.find((it) => String(it).toLowerCase() === k)
      if (hit && isAllowedIndustry(hit)) return hit
      return 'Generic'
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
    return (ALLOWED.includes(ind) ? ind : null)
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

export async function resolveIndustrySSR(slug: string): Promise<SSRIndustryResult> {
  const s = (slug || '').trim().toLowerCase()
  if (!s) return { industry: 'Generic', source: 'generic' }
  // 1) Deterministic mapping file
  const det = resolveDeterministic(s)
  if (det && det !== 'Generic') {
    try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'deterministic', industry: det }) } catch {}
    return { industry: det, source: 'deterministic' }
  }
  // 2) DB mapping (auto/manual/locked)
  const fromDb = await fetchIndustryFromDB(s)
  if (fromDb) {
    try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'db', industry: fromDb }) } catch {}
    return { industry: fromDb, source: 'db' }
  }
  // 3) Runtime LLM (guarded)
  const enabled = String(process.env.INDUSTRY_AUTOPROMOTE_ENABLED || 'true').toLowerCase() !== 'false'
  const minConf = Math.max(0, Math.min(1, Number(process.env.INDUSTRY_AUTOPROMOTE_MIN_CONF || '0.8')))
  const res = await classifyIndustryLLM(s)
  if (res && res.industry !== 'Generic') {
    if (enabled && res.confidence >= minConf) {
      await autopromote(s, res.industry, res.confidence)
      try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'llm_auto', industry: res.industry, confidence: res.confidence }) } catch {}
      return { industry: res.industry, source: 'llm_auto' }
    }
    // Always surface a suggestion in Admin, even if below autopromote threshold
    try {
      await getSvc().from('brand_industry_suggestions').insert({
        brand_slug: s,
        industry: res.industry,
        confidence: res.confidence,
        source: 'llm',
        expires_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      })
    } catch {}
    try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'llm', industry: res.industry, confidence: res.confidence }) } catch {}
    return { industry: res.industry, source: 'llm' }
  }
  try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'generic', industry: 'Generic' }) } catch {}
  return { industry: 'Generic', source: 'generic' }
}
