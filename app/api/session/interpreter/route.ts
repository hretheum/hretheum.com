import { NextRequest } from 'next/server'
import { getOpenAIClient } from '@/lib/llm'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { sessionId, messages, metadata } = body

    if (!sessionId || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Bad Request', { status: 400 })
    }

    // Shadow mode - only log, don't affect user experience
    const enabled = String(process.env.SESSION_INTERPRETER_ENABLED || 'false').toLowerCase() === 'true'
    if (!enabled) {
      return new Response(JSON.stringify({ summary: null }), { status: 200 })
    }

    // Build context from recent messages (last 10 for efficiency)
    const recentMessages = messages.slice(-10)
    const conversationText = recentMessages
      .map((m: any, i: number) => `${i % 2 === 0 ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n')

    const systemPrompt = `Analyze this chat conversation and provide a JSON response with:
- "intent_summary": 1-2 sentence summary of user's intent
- "recommended_action": specific next step the assistant should take (from: show_suggestions, show_tooltip, progressive_disclosure, show_how_it_works, or none)
- "confidence": number 0-1 indicating how confident you are in this analysis

Rules:
- Focus on the most recent user intent
- Only recommend actions that would genuinely help the user
- Be conservative - only recommend actions when very confident
- Return valid JSON only`

    const userPrompt = `Conversation context:
${conversationText}

Metadata: ${JSON.stringify(metadata || {})}

Analyze the user's most recent intent and recommend the best next action.`

    const client = getOpenAIClient()
    const timeout = Number(process.env.SESSION_INTERPRETER_TIMEOUT_MS || '3000')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await client.chat.completions.create({
        model: process.env.AI_MODEL_GENERATION || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      }, { signal: controller.signal as any })

      clearTimeout(timeoutId)

      const content = response.choices?.[0]?.message?.content || '{}'
      const parsed = JSON.parse(content)

      // Shadow mode - only log to console, don't return to client
      console.log('[Session Interpreter]', {
        sessionId,
        timestamp: new Date().toISOString(),
        intent_summary: parsed.intent_summary,
        recommended_action: parsed.recommended_action,
        confidence: parsed.confidence,
        messageCount: messages.length
      })

      // Return empty summary to client (shadow mode)
      return new Response(JSON.stringify({
        summary: null,
        shadow_logged: true
      }), { status: 200 })

    } catch (llmError) {
      console.error('[Session Interpreter] LLM error:', llmError)
      return new Response(JSON.stringify({ summary: null }), { status: 200 })
    }

  } catch (error) {
    console.error('[Session Interpreter] Error:', error)
    return new Response('Server Error', { status: 500 })
  }
}