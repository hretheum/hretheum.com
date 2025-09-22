import brandConfig from '@/data/brand_industries.json'

// Flexible runtime type; UI components must handle unknown by falling back to Generic.
export type Industry = string

export function getAllowedIndustries(): string[] {
  const raw = (brandConfig as any)?.allowed
  const arr = Array.isArray(raw) ? raw.filter((s) => typeof s === 'string') : []
  const uniq = Array.from(new Set(arr))
  return uniq.length ? uniq : ['SaaS', 'Pharma', 'FinTech', 'Commerce', 'Manufacturing', 'Public', 'Generic']
}

export function isAllowedIndustry(v: string): boolean {
  return getAllowedIndustries().includes(v)
}

export function resolveIndustry(slug: string): Industry {
  const s = (slug || '').trim().toLowerCase()
  if (!s) return 'Generic'
  const mapping = (brandConfig as any)?.mapping || {}
  const val = typeof mapping[s] === 'string' ? mapping[s] : ''
  return isAllowedIndustry(val) ? (val as Industry) : 'Generic'
}
