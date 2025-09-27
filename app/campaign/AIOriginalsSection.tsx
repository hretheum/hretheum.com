import React from 'react'
import { loadAIOriginals } from '@/lib/aiOriginals'
import { AIOriginalsShowcase } from './AIOriginalsShowcase'

type Props = {
  slugs?: string[]
}

export async function AIOriginalsSection({ slugs }: Props) {
  const items = await loadAIOriginals()
  const filtered = Array.isArray(slugs) && slugs.length > 0 ? items.filter((item) => slugs.includes(item.slug)) : items
  if (!filtered.length) return null
  return <AIOriginalsShowcase items={filtered} />
}
