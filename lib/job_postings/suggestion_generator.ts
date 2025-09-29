// LLM Suggestion Generator - Step 4
// Generate personalized interview preparation questions

import OpenAI from 'openai'
import { buildSuggestionPrompt, hashContext, type SuggestionContext } from './prompt_builder'

export interface GeneratedSuggestions {
  suggestions: string[]
  context_hash: string
  generated_at: Date
  model: string
}

export async function generateSuggestions(
  context: SuggestionContext
): Promise<GeneratedSuggestions> {
  const openai = new OpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.AI_GATEWAY_API_KEY ? process.env.AI_GATEWAY_URL : undefined,
  })
  
  const prompt = buildSuggestionPrompt(context)
  const contextHash = hashContext(context)
  
  console.log(`[suggestions] Generating for brand: ${context.brand_slug}`)
  
  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL_GENERATION || 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You generate interview preparation questions. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })
    
    const content = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)
    
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid response format')
    }
    
    console.log(`[suggestions] Generated ${parsed.suggestions.length} suggestions`)
    
    return {
      suggestions: parsed.suggestions.slice(0, 5), // Max 5
      context_hash: contextHash,
      generated_at: new Date(),
      model: process.env.AI_MODEL_GENERATION || 'gpt-4o-mini',
    }
  } catch (error: any) {
    console.error(`[suggestions] Generation failed:`, error.message)
    
    // Fallback to generic suggestions
    return {
      suggestions: getGenericSuggestions(context.brand_slug),
      context_hash: contextHash,
      generated_at: new Date(),
      model: 'fallback',
    }
  }
}

function getGenericSuggestions(brand_slug: string): string[] {
  return [
    `Tell me about your experience relevant to ${brand_slug}`,
    `What interests you about working at ${brand_slug}?`,
    `Describe your key strengths for this role`,
    `How do you handle challenging projects?`,
    `What are your career goals?`,
  ]
}