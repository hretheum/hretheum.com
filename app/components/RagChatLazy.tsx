'use client'

import dynamic from 'next/dynamic'

// Client-side only lazy loading for RagChat
const RagChat = dynamic(() => import('./RagChat'), {
  ssr: false,
  loading: () => null,
})

export default RagChat
