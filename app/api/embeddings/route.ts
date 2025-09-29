import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Force Node.js runtime for OpenAI API calls
export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_GATEWAY_API_KEY ? (process.env.AI_GATEWAY_URL || 'https://gateway.ai.vercel.com/api/v1') : undefined,
})

export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json()

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'texts array is required' },
        { status: 400 }
      )
    }

    if (texts.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 texts per request' },
        { status: 400 }
      )
    }

    // Generate embeddings for all texts
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    })

    const embeddings = response.data.map(item => item.embedding)

    return NextResponse.json({ embeddings })

  } catch (error) {
    console.error('Embedding API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    )
  }
}