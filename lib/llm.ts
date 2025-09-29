import OpenAI from 'openai'

// Shared LLM client factory.
// By default uses AI_GATEWAY_API_KEY; set INDUSTRY_FORCE_OPENAI=true to bypass gateway and use OPENAI_API_KEY directly.
export function getOpenAIClient() {
  const forceDirect = String(process.env.INDUSTRY_FORCE_OPENAI || '').toLowerCase() === 'true'
  if (!forceDirect) {
    const gatewayKey = process.env.AI_GATEWAY_API_KEY
    if (gatewayKey) {
      return new OpenAI({ apiKey: gatewayKey, baseURL: process.env.AI_GATEWAY_URL })
    }
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY or AI_GATEWAY_API_KEY')
  return new OpenAI({ apiKey })
}
