import brandConfig from '@/data/brand_industries.json'

// Flexible runtime type; UI components must handle unknown by falling back to Generic.
export type Industry = string

/**
 * Get allowed industries from JSON (synchronous fallback)
 * Note: This reads from JSON for backward compatibility.
 * For server-side code, use getAllowedIndustriesFromDB() from industry-manager.ts
 */
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

/**
 * DEPRECATED: This function reads from JSON for backward compatibility.
 * 
 * Migration note: Once industries table is populated, this file should be updated
 * to read from database. For now, keep JSON as fallback.
 * 
 * TODO after DB migration:
 * 1. Sync JSON with DB on industry creation
 * 2. Or make getAllowedIndustries() async and read from DB
 * 3. Or cache DB results in memory and refresh periodically
 */
