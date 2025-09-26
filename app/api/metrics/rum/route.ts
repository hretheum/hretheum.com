// Documentation: all comments/docstrings in English per policy.
import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null)
    if (!json || typeof json !== 'object') {
      return new Response('Bad Request', { status: 400 })
    }
    // Minimal validation: ensure name & value exist
    const { event, name, value } = json as any
    if (event !== 'web_vitals' || !name || typeof value !== 'number') {
      return new Response('Bad Request', { status: 400 })
    }
    // Optional: basic rate limiting or sampling could be added here
    // For now, we no-op and respond 204 to avoid storing PII server-side.
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      console.log('[RUM] web_vitals', {
        name: json.name,
        value: json.value,
        rating: json.rating,
        route: json.route,
        brand: json.brand,
        campaign_source: json.campaign_source,
      })
    }
    return new Response(null, { status: 204 })
  } catch (e) {
    return new Response('Server Error', { status: 500 })
  }
}
