import OpenAI from 'openai'

// Shared LLM client factory. Uses AI_GATEWAY_API_KEY if present, otherwise OPENAI_API_KEY.
export function getOpenAIClient() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY
  if (gatewayKey) {
    return new OpenAI({ apiKey: gatewayKey, baseURL: 'https://ai-gateway.vercel.sh/v1' })
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY or AI_GATEWAY_API_KEY')
  return new OpenAI({ apiKey })
}
