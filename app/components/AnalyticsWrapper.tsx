'use client'

import dynamic from 'next/dynamic'

// Client-side only analytics
const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(mod => ({ default: mod.Analytics })),
  { ssr: false }
)

export default Analytics
