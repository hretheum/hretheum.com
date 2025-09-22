import mapping from '@/data/brand_industries.json'

export type Industry = 'SaaS' | 'Pharma' | 'FinTech' | 'Commerce' | 'Manufacturing' | 'Public' | 'Generic'

const VALID: Record<string, Industry> = {
  SaaS: 'SaaS',
  Pharma: 'Pharma',
  FinTech: 'FinTech',
  Commerce: 'Commerce',
  Manufacturing: 'Manufacturing',
  Public: 'Public',
}

export function resolveIndustry(slug: string): Industry {
  const s = (slug || '').trim().toLowerCase()
  if (!s) return 'Generic'
  const key = Object.prototype.hasOwnProperty.call(mapping, s) ? s : ''
  const val = key ? (mapping as Record<string, string>)[key] : ''
  return (VALID[val] as Industry) || 'Generic'
}
