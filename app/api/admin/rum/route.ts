import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (!data.user?.email) return new Response('Unauthorized', { status: 401 })

    // Check admin access
    const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    if (!allowedEmails.includes(data.user.email.toLowerCase())) {
      return new Response('Forbidden', { status: 403 })
    }

    const url = new URL(req.url)
    const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10)))

    // For now, return mock data structure - implement actual RUM metrics aggregation later
    const mockData = {
      total: 0,
      days,
      byMetric: [
        { metric: 'LCP', count: 0, p50: null, p95: null },
        { metric: 'CLS', count: 0, p50: null, p95: null },
        { metric: 'INP', count: 0, p50: null, p95: null },
        { metric: 'FCP', count: 0, p50: null, p95: null },
        { metric: 'TTFB', count: 0, p50: null, p95: null }
      ],
      byRoute: [],
      byBrand: [],
      byDay: []
    }

    return Response.json(mockData)
  } catch (e) {
    console.error('[RUM Admin]', e)
    return new Response('Server Error', { status: 500 })
  }
}