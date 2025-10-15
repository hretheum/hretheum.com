// Internal LLM completion endpoint (no conversation logging)
// Used for system-internal LLM calls like deduplication, summarization, etc.
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * Internal LLM completion endpoint
 * Does NOT log to chat_events - use only for system-internal operations
 */
export async function POST(request: NextRequest) {
  try {
    const { message, systemPrompt, maxTokens = 500 } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_GATEWAY_API_KEY ? process.env.AI_GATEWAY_URL : undefined,
    })

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: message
      }
    ]

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    })

    const answer = completion.choices[0]?.message?.content || ''

    return NextResponse.json({
      answer: answer.trim(),
      model: completion.model,
      usage: completion.usage,
    })

  } catch (error) {
    console.error('[api/llm/complete] Error:', error)
    return NextResponse.json(
      { error: 'Internal LLM completion failed' },
      { status: 500 }
    )
  }
}
