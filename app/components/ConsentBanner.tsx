"use client";
// ConsentBanner: Accessible cookie/consent banner for behavioral analytics.
// UI copy is in Polish per product requirement; comments/docstrings are in English.

import React, { useCallback, useEffect, useMemo, useState } from 'react'

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()\[\]\\/\+^]/g, '\\$&') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

function setCookie(name: string, value: string, days = 180) {
  try {
    const d = new Date()
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
    const expires = 'expires=' + d.toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax` + (location.protocol === 'https:' ? '; Secure' : '')
  } catch {}
}

function getStoredBehavioral(): boolean | null {
  try {
    const ls = window.localStorage.getItem('hretheum:consent:behavioral')
    if (ls === '1' || ls === 'true') return true
    if (ls === '0' || ls === 'false') return false
  } catch {}
  return null
}

function setStoredBehavioral(v: boolean) {
  try {
    window.localStorage.setItem('hretheum:consent:behavioral', v ? '1' : '0')
  } catch {}
}

export default function ConsentBanner() {
  const cookieName = (process.env.NEXT_PUBLIC_CONSENT_COOKIE_NAME || 'hre_consent_analytics')
  const defaultBehavioral = (process.env.NEXT_PUBLIC_BEHAVIORAL_DEFAULT || 'allow').toLowerCase()
  const requireBanner = (process.env.NEXT_PUBLIC_REQUIRE_CONSENT_BANNER ?? 'true') !== 'false'

  const [visible, setVisible] = useState(false)

  const decided = useMemo(() => {
    const ls = getStoredBehavioral()
    if (ls !== null) return true
    const cv = getCookie(cookieName)
    if (cv === '1' || cv === 'true' || cv === '0' || cv === 'false') return true
    return false
  }, [cookieName])

  const applyConsent = useCallback((v: boolean) => {
    try {
      // Persist in both localStorage and cookie
      setStoredBehavioral(v)
      setCookie(cookieName, v ? '1' : '0', 365)
      // Expose global for quick checks
      ;(window as any).hretheumConsent = { behavioral: v }
      // Notify listeners (RedirectBeacon, others)
      window.dispatchEvent(new Event('hre:consent-changed'))
    } catch {}
  }, [cookieName])

  const accept = useCallback(() => {
    applyConsent(true)
    setVisible(false)
  }, [applyConsent])

  const deny = useCallback(() => {
    applyConsent(false)
    setVisible(false)
  }, [applyConsent])

  useEffect(() => {
    if (!requireBanner) return
    // Show banner only if no explicit decision yet
    if (!decided) {
      setVisible(true)
      // Initialize global from default while awaiting choice (do not persist)
      ;(window as any).hretheumConsent = { behavioral: defaultBehavioral !== 'deny' }
    } else {
      // Sync global from stored choice
      const stored = getStoredBehavioral()
      if (stored !== null) (window as any).hretheumConsent = { behavioral: stored }
      else {
        const cv = getCookie(cookieName)
        const v = cv === '1' || cv === 'true'
        ;(window as any).hretheumConsent = { behavioral: v }
      }
    }
  }, [cookieName, decided, defaultBehavioral, requireBanner])

  if (!visible) return null

  return (
    <div role="dialog" aria-live="polite" aria-label="Zgoda na analitykę" className="fixed inset-x-0 bottom-0 z-[1000] px-4 pb-6">
      <div className="mx-auto max-w-3xl rounded-xl border shadow-lg bg-white/95 backdrop-blur p-4 md:p-5">
        <div className="md:flex md:items-center md:justify-between gap-4">
          <p className="text-sm text-gray-700 md:text-base">
            Używamy anonimowych danych o zachowaniu, aby ulepszać doświadczenie. Czy wyrażasz zgodę na analitykę behawioralną?
          </p>
          <div className="mt-3 md:mt-0 flex items-center gap-2 md:gap-3">
            <button onClick={deny} className="px-3 py-2 text-sm font-medium border rounded-md text-gray-600 border-gray-300 hover:bg-gray-50">
              Odrzucam
            </button>
            <button onClick={accept} className="px-3 py-2 text-sm font-semibold rounded-md text-white" style={{ backgroundColor: 'var(--campaign-accent, var(--theme-accent, #7c3aed))' }}>
              Akceptuję
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Możesz zmienić decyzję w dowolnym momencie. Więcej w Polityce prywatności.
        </div>
      </div>
    </div>
  )
}
