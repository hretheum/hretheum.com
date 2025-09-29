// All comments/documentation in English per project rules.
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAIClient() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY
  if (gatewayKey) {
    return new OpenAI({ apiKey: gatewayKey, baseURL: process.env.AI_GATEWAY_URL || 'https://gateway.ai.vercel.com/api/v1' })
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY or AI_GATEWAY_API_KEY')
  return new OpenAI({ apiKey })
}

export async function POST(req: NextRequest) {
  try {
    const enabled = String(process.env.RULES_AI_FOLLOWUPS_ENABLED ?? 'true').toLowerCase() === 'true'
    if (!enabled) return NextResponse.json({ followups: [] })

    const body = await req.json().catch(() => ({})) as any
    const answer = String(body?.answer || '').trim()
    const intentId = String(body?.intentId || '')
    const industry = String(body?.industry || '')
    const maxCount = Math.min(3, Math.max(1, Number(body?.max || 2)))

    if (!answer) return NextResponse.json({ followups: [] })

    const sys = `You suggest short, helpful follow-up questions for a chat UI. Return STRICT JSON: {"followups":["..."]}.
- 1 to ${maxCount} items, 3-9 words each, natural, non-repetitive.
- No PII, no sensitive topics, no tables, no markdown, no quotes.
- Use the same language as the user's context if obvious; otherwise English.
- Avoid duplicating the input answer content; propose next logical steps.
- If you have an intent (e.g. ${intentId || 'unknown'}), keep follow-ups relevant to it.`
    const usr = `Context answer (assistant just said):\n${answer}\n\nIndustry: ${industry || 'Generic'}\nIntent: ${intentId || 'unknown'}\nReturn JSON only.`

    const client = getOpenAIClient()
    const model = process.env.AI_MODEL_GENERATION || 'gpt-4o-mini'
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort('followups_timeout'), Math.min(2500, Number(process.env.RULES_AI_TIMEOUT_MS || 2500)))
    try {
      const res = await client.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: usr }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        },
        { signal: ctrl.signal as any }
      )
      const content = res.choices?.[0]?.message?.content || ''
      let parsed: any = null
      try { parsed = JSON.parse(content) } catch { parsed = { followups: [] } }
      const items = Array.isArray(parsed.followups) ? parsed.followups : []
      const clean = items
        .map((s: any) => String(s || '').trim())
        .filter((s: string) => s.length >= 3 && s.length <= 120)
        .slice(0, maxCount)
      return NextResponse.json({ followups: clean })
    } finally {
      clearTimeout(t)
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[followups.generate]', err)
    return NextResponse.json({ followups: [] })
  }
}
