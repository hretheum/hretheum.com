import { ImageResponse } from 'next/og'
import React from 'react'

export const runtime = 'edge'
export const revalidate = 60 * 60 // 1 hour

const size = { width: 180, height: 180 }

export async function GET() {
  const element = React.createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
        color: '#ffffff',
        fontSize: 92,
        fontWeight: 900,
        letterSpacing: -2,
      } as React.CSSProperties,
    },
    'H'
  )
  return new ImageResponse(element, { ...size })
}
