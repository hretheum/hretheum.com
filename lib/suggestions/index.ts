// All comments/documentation in English per project rules.
// Suggestions generator for low-confidence RAG scenarios (T15-1/T15-5).

import type { Industry } from '@/lib/industry'

// Basic, safe, template-based suggestions per industry. No trademarks/logos.
export async function getSuggestedQueries(industry: Industry | 'Generic', brandSlug?: string): Promise<string[]> {
  const b = (brandSlug || '').toLowerCase()
  const brandHint = b ? ` for ${b}` : ''
  const common = [
    `Show competencies overview${brandHint}`,
    `What leadership approach do you use${brandHint}?`,
    `Share a case study relevant to ${industry.toString()}`,
    `What experience is most relevant to ${industry.toString()}?`,
    `How do you measure outcomes in ${industry.toString()}?`,
  ]

  let suggestions: string[] = []

  switch (industry) {
    case 'SaaS':
      suggestions = [
        `Case studies about product-led growth${brandHint}`,
        `Design system governance in multi-tenant apps`,
        `Signals for trial→paid conversion`,
        ...common.slice(0, 2),
      ]
      break
    case 'Pharma':
      suggestions = [
        `Compliance-friendly research process`,
        `Signals tied to GxP contexts`,
        `Privacy and audit trails in design ops`,
        ...common.slice(0, 2),
      ]
      break
    case 'FinTech':
      suggestions = [
        `Risk & compliance-aware UX signals`,
        `Reducing fraud while improving UX`,
        `Payments reliability and latency`,
        ...common.slice(0, 2),
      ]
      break
    case 'Commerce':
      suggestions = [
        `Customer journey signals (browse→checkout)`,
        `Fulfillment and seasonality readiness`,
        `Merchandising and growth alignment`,
        ...common.slice(0, 2),
      ]
      break
    case 'Retail':
      suggestions = [
        `Shopper journey signals across channels`,
        `Cohorts, retention, depth per session`,
        `Drive-to-store campaign readiness`,
        ...common.slice(0, 2),
      ]
      break
    case 'Manufacturing':
      suggestions = [
        `Quality & safety signals in operations`,
        `Shift readiness and plant operations`,
        `Digital transformation for OT/IT`,
        ...common.slice(0, 2),
      ]
      break
    case 'Public':
      suggestions = [
        `Procurement & transparency constraints`,
        `Security and residency requirements`,
        `Citizen-facing service reliability`,
        ...common.slice(0, 2),
      ]
      break
    case 'DigitalTech':
      suggestions = [
        `Design platforms across verticals`,
        `Enterprise discovery→delivery cadence`,
        `AI- and data-informed design ops`,
        ...common.slice(0, 2),
      ]
      break
    case 'eLearning':
      suggestions = [
        `Learning experience design patterns`,
        `Assessment and feedback systems`,
        `Accessibility in digital education`,
        ...common.slice(0, 2),
      ]
      break
    case 'Telecom':
      suggestions = [
        `Network reliability and user experience`,
        `Service design for complex tech stacks`,
        `Customer support experience optimization`,
        ...common.slice(0, 2),
      ]
      break
    case 'Generic':
    default:
      suggestions = [
        `Show a relevant case study${brandHint}`,
        `What are the key competencies${brandHint}?`,
        `Leadership approach overview${brandHint}`,
        `Share a project from your portfolio${brandHint}`,
        `What makes your work unique${brandHint}?`,
      ]
      break
  }

  // LLM-powered semantic deduplication (eliminates semantic duplicates)
  const deduplicated = await deduplicateWithLLM(suggestions)

  return deduplicated
}

async function deduplicateWithLLM(suggestions: string[]): Promise<string[]> {
  if (suggestions.length <= 1) return suggestions

  try {
    // Step 1: Generate embeddings using API endpoint
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: suggestions })
    })

    if (!response.ok) {
      throw new Error(`Embedding API failed: ${response.status}`)
    }

    const { embeddings } = await response.json()

    // Step 2: Calculate cosine similarities between all pairs
    const similarities: number[][] = []
    for (let i = 0; i < embeddings.length; i++) {
      similarities[i] = []
      for (let j = 0; j < embeddings.length; j++) {
        if (i === j) {
          similarities[i][j] = 1.0
        } else {
          similarities[i][j] = cosineSimilarity(embeddings[i], embeddings[j])
        }
      }
    }

    // Step 3: Group similar suggestions using clustering
    const clusters = clusterSimilarSuggestions(similarities, 0.85) // 85% similarity threshold

    // Step 4: Select best representative from each cluster
    const deduplicated: string[] = []
    for (const cluster of clusters) {
      if (cluster.length === 1) {
        deduplicated.push(suggestions[cluster[0]])
      } else {
        // For multiple similar suggestions, use LLM to create unified version
        const unified = await createUnifiedSuggestion(suggestions.filter((_, idx) => cluster.includes(idx)))
        deduplicated.push(unified)
      }
    }

    return deduplicated

  } catch (error) {
    console.warn('[suggestions:deduplication] LLM deduplication failed, falling back to heuristic:', error)
    // Fallback to enhanced heuristic deduplication
    return deduplicateWithHeuristics(suggestions)
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Simple clustering algorithm for similar suggestions
function clusterSimilarSuggestions(similarities: number[][], threshold: number): number[][] {
  const clusters: number[][] = []
  const used = new Set<number>()

  for (let i = 0; i < similarities.length; i++) {
    if (used.has(i)) continue

    const cluster = [i]
    used.add(i)

    // Find all similar suggestions
    for (let j = i + 1; j < similarities.length; j++) {
      if (!used.has(j) && similarities[i][j] > threshold) {
        cluster.push(j)
        used.add(j)
      }
    }

    clusters.push(cluster)
  }

  return clusters
}

// Use LLM to create a unified, non-duplicate version of similar suggestions
async function createUnifiedSuggestion(similarSuggestions: string[]): Promise<string> {
  if (similarSuggestions.length === 0) return ''
  if (similarSuggestions.length === 1) return similarSuggestions[0]

  try {
    const prompt = `
You are given ${similarSuggestions.length} semantically similar question suggestions for a job interview chat:

${similarSuggestions.map((s, i) => `${i + 1}. "${s}"`).join('\n')}

Create ONE unified, non-duplicate question that captures the essence of all these suggestions.
The unified question should:
- Be natural and conversational
- Avoid repetition
- Be specific but not too narrow
- Work well in a professional job interview context

Return only the unified question, no explanation.
    `.trim()

    const systemPrompt = 'You are an expert at creating clear, non-duplicate interview questions from similar suggestions.'

    // Use API endpoint instead of direct import
    const response = await fetch('/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        stream: false
      })
    })

    const data = await response.json()
    const unified = data.answer?.trim()

    // Fallback: return the first suggestion if LLM fails
    return unified || similarSuggestions[0]

  } catch (error) {
    console.warn('[suggestions:unified] LLM unification failed:', error)
    return similarSuggestions[0]
  }
}

// Fallback heuristic deduplication (enhanced version)
function deduplicateWithHeuristics(suggestions: string[]): string[] {
  const deduplicated = []
  for (const suggestion of suggestions) {
    let isDuplicate = false
    for (const existing of deduplicated) {
      // Enhanced semantic deduplication with multiple heuristics

      // 1. Word overlap similarity (>80% threshold)
      const suggestionWords = new Set(suggestion.toLowerCase().split(/\s+/).filter(w => w.length > 2))
      const existingWords = new Set(existing.toLowerCase().split(/\s+/).filter(w => w.length > 2))
      const intersection = new Set([...suggestionWords].filter(x => existingWords.has(x)))
      const wordSimilarity = intersection.size / Math.max(suggestionWords.size, existingWords.size)

      // 2. Semantic similarity (check for common key phrases)
      const keyPhrases = ['competencies', 'leadership', 'experience', 'case study', 'approach', 'overview', 'skills']
      const suggestionKeyPhrases = keyPhrases.filter(phrase => suggestion.toLowerCase().includes(phrase))
      const existingKeyPhrases = keyPhrases.filter(phrase => existing.toLowerCase().includes(phrase))
      const phraseSimilarity = suggestionKeyPhrases.filter(p => existingKeyPhrases.includes(p)).length /
                              Math.max(suggestionKeyPhrases.length, existingKeyPhrases.length)

      // 3. Normalized similarity (remove brand context)
      const normalizedSuggestion = suggestion.replace(/\s+(for|at)\s+\w+/gi, '').toLowerCase()
      const normalizedExisting = existing.replace(/\s+(for|at)\s+\w+/gi, '').toLowerCase()
      const normalizedSimilarity = normalizedSuggestion === normalizedExisting ? 1 :
        normalizedSuggestion.includes(normalizedExisting) || normalizedExisting.includes(normalizedSuggestion) ? 0.9 : 0

      // Consider duplicate if any similarity metric exceeds threshold
      if (wordSimilarity > 0.8 || phraseSimilarity > 0.7 || normalizedSimilarity > 0.8) {
        isDuplicate = true
        break
      }
    }

    if (!isDuplicate) {
      deduplicated.push(suggestion)
    }
  }

  return deduplicated
}

// Enhanced suggestions that consider campaign-specific context
export async function getEnhancedSuggestedQueries(
  industry: Industry | 'Generic',
  brandSlug?: string
): Promise<string[]> {
  if (!brandSlug) {
    return getSuggestedQueries(industry, brandSlug)
  }

  try {
    // Query server API for campaign-specific suggestions (keeps client bundle Node-free)
    const response = await fetch('/api/suggestions/campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandSlug })
    })

    if (response.ok) {
      const { suggestions } = await response.json()
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        // Apply the same LLM-based deduplication pipeline as generic suggestions
        const dedup = await deduplicateWithLLM(suggestions)
        return dedup
      }
    }
  } catch {
    // Fall back to generic suggestions if campaign lookup fails
  }
  // Fall back to industry-based suggestions
  return getSuggestedQueries(industry, brandSlug)
}

// Client-safe stub: server logic moved to /api/suggestions/campaign
async function getCampaignSpecificSuggestions(..._args: any[]): Promise<string[]> {
  return []
}