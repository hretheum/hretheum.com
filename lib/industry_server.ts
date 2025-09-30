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
const EXCLUDE_FROM_LLM = new Set(['generic', 'dummy'])
const NON_GENERIC = ALLOWED.filter((x) => !EXCLUDE_FROM_LLM.has(String(x).toLowerCase()))

export type IndustrySource = 'deterministic' | 'db' | 'llm' | 'llm_auto' | 'llm_lowconf' | 'generic'
export type SSRIndustryResult = { industry: Industry; source: IndustrySource; confidence?: number }

const DBG = String(process.env.INDUSTRY_LOG || '').toLowerCase() === 'debug'
function dlog(...a: any[]) { if (DBG) console.log('[industry]', ...a) }
const DUMMY_CONF_MAX = Math.max(0, Math.min(1, Number(process.env.INDUSTRY_DUMMY_CONF_MAX || '0.05')))

async function classifyIndustryLLM(slug: string, timeoutMs?: number): Promise<{ industry: Industry; confidence: number } | null> {
  try {
    const requestedModel = process.env.AI_MODEL_GENERATION || 'gpt-4o-mini'
    const modelCandidates = Array.from(new Set([requestedModel, 'gpt-4o-mini', 'gpt-4o', 'o4-mini', 'gpt-4.1-mini']))
    dlog('LLM classify start', { slug, timeoutMs: timeoutMs ?? process.env.INDUSTRY_LLM_TIMEOUT_MS ?? 5000, modelCandidates })
    const client = getOpenAIClient()
    const requested = Number(timeoutMs ?? process.env.INDUSTRY_LLM_TIMEOUT_MS ?? 5000)
    const effTimeout = Number.isFinite(requested) ? Math.max(500, requested) : 5000
    const sys = `Classify the company brand into one of these industries: ${NON_GENERIC.join(', ')}. Respond ONLY JSON: {"industry":"<one>", "confidence":<0..1>}. Use brand name context only; do not hallucinate logos/claims. If uncertain, pick the closest from the list.`
    const user = `brand: ${slug}`

    for (const model of modelCandidates) {
      try {
        dlog('LLM try model', model)
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), effTimeout)
        const basePayload: any = {
          model,
          temperature: 0,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: user },
          ],
        }
        let res = await client.chat.completions.create({ ...basePayload, response_format: { type: 'json_object' } }, { signal: controller.signal as any })
        clearTimeout(timer)
        let txt = res.choices?.[0]?.message?.content || ''
        dlog('LLM raw txt', String(txt).slice(0, 200))
        let parsed: any
        try {
          const fenceMatch = String(txt).match(/\{[\s\S]*\}/)
          const jsonish = fenceMatch ? fenceMatch[0] : String(txt)
          parsed = JSON.parse(jsonish)
        } catch (e1) {
          dlog('LLM parse failed, retrying without response_format')
          const controller2 = new AbortController()
          const timer2 = setTimeout(() => controller2.abort(), effTimeout)
          res = await client.chat.completions.create({ ...basePayload }, { signal: controller2.signal as any })
          clearTimeout(timer2)
          txt = res.choices?.[0]?.message?.content || ''
          dlog('LLM raw txt retry', String(txt).slice(0, 200))
          try {
            const fenceMatch2 = String(txt).match(/\{[\s\S]*\}/)
            const jsonish2 = fenceMatch2 ? fenceMatch2[0] : String(txt)
            parsed = JSON.parse(jsonish2)
          } catch (e2) {
            const indMatch = String(txt).match(/industry\"?\s*[:=]\s*\"?([A-Za-z]+)\"?/i)
            const confMatch = String(txt).match(/confidence\"?\s*[:=]\s*([0-9]*\.?[0-9]+)/i)
            parsed = { industry: indMatch ? indMatch[1] : '', confidence: confMatch ? Number(confMatch[1]) : 0.5 }
          }
        }
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
            'elearning':'eLearning','edtech':'eLearning','education':'eLearning',
            'telecom':'Telecom','telecommunications':'Telecom','telco':'Telecom','carrier':'Telecom','isp':'Telecom','wireless':'Telecom','mobilecarrier':'Telecom','mobileoperator':'Telecom','5g':'Telecom',
            'digitaltech':'DigitalTech','digitaltechnology':'DigitalTech','digitalagency':'DigitalTech','softwarehouse':'DigitalTech','techconsultancy':'DigitalTech','itservices':'DigitalTech','itconsulting':'DigitalTech'
          }
          const k = v.toLowerCase()
          const viaSyn = m[k]
          if (viaSyn && isAllowedIndustry(viaSyn)) return viaSyn
          const nk = k.replace(/[^a-z]/g, '')
          const viaSyn2 = m[nk]
          if (viaSyn2 && isAllowedIndustry(viaSyn2)) return viaSyn2
          const hit = ALLOWED.find((it) => String(it).toLowerCase() === k)
          if (hit && isAllowedIndustry(hit) && String(hit).toLowerCase() !== 'dummy') return hit
          return 'Generic'
        }
        const industry = norm(ind)
        const out = { industry, confidence: Math.max(0, Math.min(1, conf)) }
        dlog('LLM classify done', { ...out, model })
        return out
      } catch (err: any) {
        // If invalid model id, continue to next candidate
        if (err?.status === 400 && String(err?.type || err?.error?.type || '').includes('invalid')) {
          dlog('LLM invalid model, fallback to next', { model })
          continue
        }
        throw err
      }
    }
    return null
  } catch (err) {
    console.error('[industry] LLM classify error', err)
    return null
  }
}

async function fetchIndustryFromDB(slug: string): Promise<Industry | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
    const anon = getAnon()
    // Try 'brand_slug' first (actual column name), fallback to 'slug'
    let data, error
    const result1 = await anon.from('brand_industries').select('*').eq('brand_slug', slug).maybeSingle()
    if (result1.error?.code === '42703') {
      // Column doesn't exist, try 'slug'
      const result2 = await anon.from('brand_industries').select('*').eq('slug', slug).maybeSingle()
      data = result2.data
      error = result2.error
    } else {
      data = result1.data
      error = result1.error
    }
    
    console.log('[industry] fetchIndustryFromDB:', { slug, data, error })
    if (error) {
      console.error('[industry] DB fetch error:', error)
      return null
    }
    const ind = String(data?.industry || '') as Industry
    const allowed = ALLOWED.includes(ind)
    console.log('[industry] DB result:', { slug, industry: ind, allowed, ALLOWED })
    return (allowed ? ind : null)
  } catch (err) {
    console.error('[industry] fetchIndustryFromDB exception:', err)
    return null
  }
}

async function autopromote(slug: string, industry: Industry, confidence: number) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    const svc = getSvc()
    // Use 'brand_slug' as column name
    await svc.from('brand_industries').upsert({ brand_slug: slug, industry, status: 'auto', updated_by: 'llm', note: JSON.stringify({ confidence }) })
    // optional: store suggestion
    try {
      await svc.from('brand_industry_suggestions').insert({ brand_slug: slug, industry, confidence, source: 'llm', expires_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString() })
    } catch {}
  } catch {}
}

async function ensureDeterministicMapping(slug: string, industry: Industry) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return // require service key to write
    const svc = getSvc()
    // Use 'brand_slug' as column name
    await svc.from('brand_industries').upsert({ brand_slug: slug, industry, status: 'manual', updated_by: 'deterministic', note: { source: 'deterministic' } as any })
  } catch (err) {
    console.error('[industry] ensureDeterministicMapping error', err)
  }
}

export async function resolveIndustrySSR(slug: string): Promise<SSRIndustryResult> {
  const s = (slug || '').trim().toLowerCase()
  if (!s) return { industry: 'Generic', source: 'generic' }
  // 1) Deterministic mapping file
  const det = resolveDeterministic(s)
  if (det && det !== 'Generic') {
    dlog('deterministic hit', { slug: s, det })
    try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'deterministic', industry: det }) } catch {}
    // Persist deterministic mapping for Admin visibility
    await ensureDeterministicMapping(s, det)
    return { industry: det, source: 'deterministic' }
  }
  // 2) DB mapping (auto/manual/locked)
  const fromDb = await fetchIndustryFromDB(s)
  if (fromDb) {
    dlog('db hit', { slug: s, fromDb })
    try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'db', industry: fromDb }) } catch {}
    return { industry: fromDb, source: 'db' }
  }
  // 3) Runtime LLM (guarded)
  const enabled = String(process.env.INDUSTRY_AUTOPROMOTE_ENABLED || 'true').toLowerCase() !== 'false'
  const minConf = Math.max(0, Math.min(1, Number(process.env.INDUSTRY_AUTOPROMOTE_MIN_CONF || '0.8')))
  dlog('llm stage', { slug: s, enabled, minConf, hasSvcKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) })
  const res = await classifyIndustryLLM(s)
  if (res) {
    // Low-confidence: show Dummy template to avoid misleading content for jokey/unknown slugs
    if (res.confidence <= DUMMY_CONF_MAX) {
      dlog('llm low confidence => Dummy', { slug: s, res, threshold: DUMMY_CONF_MAX })
      try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'llm_lowconf', industry: 'Dummy', confidence: res.confidence }) } catch {}
      return { industry: 'Dummy', source: 'llm_lowconf', confidence: res.confidence }
    }
  }
  if (res && res.industry !== 'Generic') {
    if (enabled && res.confidence >= minConf) {
      await autopromote(s, res.industry, res.confidence)
      try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'llm_auto', industry: res.industry, confidence: res.confidence }) } catch {}
      return { industry: res.industry, source: 'llm_auto', confidence: res.confidence }
    }
    dlog('llm suggestion (below threshold)', { slug: s, res })
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
    return { industry: res.industry, source: 'llm', confidence: res.confidence }
  }
  dlog('generic fallback', { slug: s })
  try { await getSvc().from('industry_resolution_events').insert({ brand_slug: s, source: 'generic', industry: 'Generic' }) } catch {}
  return { industry: 'Generic', source: 'generic' }
}
