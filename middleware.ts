import { NextRequest, NextResponse } from 'next/server'

// Apex domain used for canonical brand routes. Can be overridden at build-time.
const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com'

// Reserved/system subdomains that must NOT participate in brand routing
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'admin',
  'api',
  'auth',
  'static',
  'cdn',
  'assets',
  'img',
  'mail',
  'ftp',
  'm',
  'stage',
  'dev',
])

// Validate and normalize a single-label brand slug
function normalizeSlug(label: string): string | null {
  if (!label) return null
  const lower = label.toLowerCase()
  // Reject IDN/punycode and invalid characters
  if (lower.startsWith('xn--')) return null
  // Keep only [a-z0-9-]
  let cleaned = lower.replace(/[^a-z0-9-]/g, '')
  // Collapse multiple dashes, trim edges
  cleaned = cleaned.replace(/-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')
  if (!cleaned) return null
  if (cleaned.length > 63) return null
  // Ensure matches policy
  if (!/^[a-z0-9-]{1,63}$/.test(cleaned)) return null
  return cleaned
}

function getHostname(req: NextRequest): string {
  // Prefer x-forwarded-host (may be a comma-separated list), then Host header, then URL hostname
  const fwd = req.headers.get('x-forwarded-host') || ''
  const hostHeader = req.headers.get('host') || ''
  const candidate = (fwd.split(',')[0] || hostHeader || req.nextUrl.hostname).trim()
  // Remove port if present
  return candidate.replace(/:\d+$/, '')
}

export function middleware(req: NextRequest) {
  const hostname = getHostname(req)

  // Only act on subdomains of the APEX_DOMAIN
  if (!hostname.endsWith('.' + APEX_DOMAIN)) {
    return NextResponse.next()
  }

  // Extract the label(s) before the apex, e.g. foo.hretheum.com -> ["foo"]
  const parts = hostname.split('.')
  const apexParts = APEX_DOMAIN.split('.')
  if (parts.length <= apexParts.length) {
    return NextResponse.next()
  }
  const subdomainParts = parts.slice(0, parts.length - apexParts.length)

  // Only accept a single-label subdomain for brand routing (e.g., foo.hretheum.com)
  if (subdomainParts.length !== 1) {
    // Multiple labels (e.g., a.b.hretheum.com) → treat as invalid brand; redirect to /brand (no slug)
    return redirectToBrand(req)
  }

  const label = subdomainParts[0]

  // Skip reserved subdomains entirely (render neutral apex route)
  if (RESERVED_SUBDOMAINS.has(label.toLowerCase())) {
    return NextResponse.next()
  }

  const slug = normalizeSlug(label)

  // Build destination: always root brand route; preserve query/UTM; avoid loops
  if (slug) {
    return redirectToBrand(req, slug)
  } else {
    // Invalid slug → redirect to /brand (no slug)
    return redirectToBrand(req)
  }
}

function redirectToBrand(req: NextRequest, slug?: string) {
  // Preserve protocol from the incoming request
  const proto = req.nextUrl.protocol // includes trailing ':'
  const search = req.nextUrl.search // preserves ?query
  const destPath = slug ? `/brand/${slug}` : '/brand'
  const url = new URL(`${proto}//${APEX_DOMAIN}${destPath}${search}`)

  // Prevent redirect loops: if already at the target apex + path, just continue
  if (
    req.nextUrl.hostname === APEX_DOMAIN &&
    req.nextUrl.pathname.replace(/\/+$/, '') === destPath &&
    (req.nextUrl.search || '') === (search || '')
  ) {
    return NextResponse.next()
  }

  return NextResponse.redirect(url, 301)
}

export const config = {
  // Exclude Next.js internals and common static paths
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets|static).*)',
  ],
}
