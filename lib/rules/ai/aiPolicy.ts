import OpenAI from 'openai'
import { z } from 'zod'

// ===== Types & Schemas =====

export const AllowedActionSchema = z.enum([
  'ui.show_suggestions',
  'ui.tooltip',
  'ui.compress_above_fold',
  'ui.show_how_it_works',
  'ui.emphasize_case_studies',
])
export type AllowedAction = z.infer<typeof AllowedActionSchema>

export const AiPolicyResponseSchema = z.object({
  recommended_action: AllowedActionSchema.nullable().default(null),
  confidence: z.number().min(0).max(1).default(0),
  intent_summary: z.string().max(400).optional(),
})
export type AiPolicyResponse = z.infer<typeof AiPolicyResponseSchema>

export const SessionSummarySchema = z.object({
  ts: z.number().optional(),
  session_id: z.string().optional(),
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
      scroll: z
        .object({ depth_bucket: z.number().optional(), velocity_bucket: z.number().optional() })
        .optional(),
      hesitation_ms: z.number().optional(),
      rage_clicks: z.number().optional(),
      dead_clicks: z.number().optional(),
      cta_clicks: z.record(z.number()).optional(),
    })
    .optional(),
  rag: z
    .object({ intent: z.string().optional(), confidence: z.number().min(0).max(1).optional(), lowConfidence: z.boolean().optional() })
    .optional(),
})
export type SessionSummary = z.infer<typeof SessionSummarySchema>

// ===== Config Helpers =====

const DEBUG = String(process.env.RULES_AI_DEBUG ?? 'false').toLowerCase() === 'true'
function dlog(message: string, extra?: any) {
  if (!DEBUG) return
  try {
    const logger = globalThis.console
    logger?.info?.('[rules.ai]', message, extra ?? '')
  } catch {}
}

function parseAllowedActionsEnv(): AllowedAction[] {
  const raw = process.env.RULES_AI_ALLOWED_ACTIONS || 'ui.show_suggestions,ui.tooltip,ui.show_how_it_works'
  const items = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const acc: AllowedAction[] = []
  for (const it of items) {
    const p = AllowedActionSchema.safeParse(it)
    if (p.success) acc.push(p.data)
  }
  // de-dup
  return Array.from(new Set(acc))
}

function getSampleRate(): number {
  const v = Number(process.env.RULES_AI_SAMPLE_RATE ?? '0.2')
  if (Number.isFinite(v) && v >= 0 && v <= 1) return v
  return 0.2
}

function getTimeoutMs(): number {
  const v = Number(process.env.RULES_AI_TIMEOUT_MS ?? '400')
  if (Number.isFinite(v) && v >= 100 && v <= 5000) return v
  return 400
}

export function isAiEnabled(): boolean {
  // Server-side master flag; NEXT_PUBLIC_* may gate client-side callers
  const serverEnabled = String(process.env.RULES_AI_ENABLED ?? 'true').toLowerCase() !== 'false'
  return serverEnabled
}

export function isShadowOnly(): boolean {
  return String(process.env.RULES_AI_SHADOW_ONLY ?? 'true').toLowerCase() === 'true'
}

export function shouldSample(): boolean {
  const rate = getSampleRate()
  return Math.random() < rate
}

// ===== Core Policy =====

export async function recommendAiAction(summary: SessionSummary): Promise<AiPolicyResponse | null> {
  if (!isAiEnabled()) {
    dlog('skip: disabled (RULES_AI_ENABLED=false)')
    return null
  }
  if (!summary?.consent) {
    dlog('skip: no consent')
    return null
  }
  if (!shouldSample()) {
    dlog('skip: sampling miss', { rate: process.env.RULES_AI_SAMPLE_RATE })
    return null
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    dlog('skip: missing OPENAI_API_KEY')
    return null
  }

  const allowed = parseAllowedActionsEnv()
  if (allowed.length === 0) {
    dlog('skip: empty allowlist (RULES_AI_ALLOWED_ACTIONS)')
    return null
  }

  const client = new OpenAI({ apiKey: OPENAI_API_KEY })
  const model = process.env.AI_MODEL_GENERATION || 'gpt-4o-mini'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs())

  try {
    const sys = [
      'You are an analyst deciding one UX micro-adjustment based on a concise session summary.',
      'Only propose an action from the allowed list. If none applies, set recommended_action to null and confidence to 0.',
      'Return strictly JSON matching the schema: { "recommended_action": <allowed|string|null>, "confidence": <0..1>, "intent_summary": <string optional> }.',
      'Be conservative: prioritize precision over recall.',
    ].join(' ')

    const user = [
      'Allowed actions: ' + allowed.join(', '),
      'Session summary (JSON):',
      JSON.stringify(summary),
    ].join('\n')

    const resp = await client.chat.completions.create(
      {
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      },
      { signal: controller.signal },
    )

    const content = resp.choices?.[0]?.message?.content || '{}'
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      // Best-effort extract JSON object
      const start = content.indexOf('{')
      const end = content.lastIndexOf('}')
      if (start >= 0 && end > start) {
        const maybe = content.slice(start, end + 1)
        parsed = JSON.parse(maybe)
      } else {
        parsed = {}
      }
    }
    const result = AiPolicyResponseSchema.safeParse(parsed)
    if (!result.success) {
      dlog('skip: schema parse failed', { issues: result.error.issues })
      return null
    }

    // Enforce allowlist at runtime (defense in depth)
    const out = result.data
    if (out.recommended_action && !allowed.includes(out.recommended_action)) {
      out.recommended_action = null
      out.confidence = 0
    }
    dlog('ok: recommendation', out)
    return out
  } catch (err: any) {
    dlog('error: policy call failed', { message: err?.message || String(err) })
    return null
  } finally {
    clearTimeout(timeout)
  }
}
