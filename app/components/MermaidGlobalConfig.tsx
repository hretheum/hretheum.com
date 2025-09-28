'use client'
// All comments/docstrings in English per policy.
// Global Mermaid config: silence error overlays and keep logs in console only.

import React, { useEffect } from 'react'

export default function MermaidGlobalConfig() {
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Lazy import to avoid SSR issues
        const mod: any = await import('mermaid')
        if (!mounted) return
        const mermaid = mod.default ?? mod
        try {
          // Prevent global UI overlays; log errors to console instead
          mermaid.parseError = (err: unknown) => {
            console.error('[Mermaid parse error]', err)
          }
        } catch {}
      } catch {}
    })()
    return () => {
      mounted = false
    }
  }, [])

  // No UI output
  return null
}
