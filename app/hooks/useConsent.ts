"use client";
// useConsent: shared hook to read and update behavioral consent across the app.
// Exposes { behavioral, decided, setBehavioral }.
// Persists to localStorage and cookie, emits 'hre:consent-changed'.

import { useCallback, useEffect, useRef, useState } from 'react'

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()\[\]\\/\+^]/g, '\\$&') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

function setCookie(name: string, value: string, days = 365) {
  try {
    const d = new Date()
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
    const expires = 'expires=' + d.toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax` + (location.protocol === 'https:' ? '; Secure' : '')
  } catch {}
}

function readStored(): boolean | null {
  try {
    const ls = window.localStorage.getItem('hretheum:consent:behavioral')
    if (ls === '1' || ls === 'true') return true
    if (ls === '0' || ls === 'false') return false
  } catch {}
  return null
}

export function useConsent() {
  const cookieName = (process.env.NEXT_PUBLIC_CONSENT_COOKIE_NAME || 'hre_consent_analytics')
  const defaultBehavioral = (process.env.NEXT_PUBLIC_BEHAVIORAL_DEFAULT || 'allow').toLowerCase()
  const [behavioral, setBehavioralState] = useState<boolean>(() => {
    try {
      const w: any = typeof window !== 'undefined' ? window : undefined
      if (w && w.hretheumConsent && typeof w.hretheumConsent.behavioral === 'boolean') {
        return !!w.hretheumConsent.behavioral
      }
      const stored = readStored()
      if (stored !== null) return stored
      const cv = getCookie(cookieName)
      if (cv === '1' || cv === 'true') return true
      if (cv === '0' || cv === 'false') return false
    } catch {}
    return defaultBehavioral !== 'deny'
  })

  const decidedRef = useRef<boolean>(false)
  const [decided, setDecided] = useState<boolean>(false)

  useEffect(() => {
    const stored = readStored()
    const cv = getCookie(cookieName)
    const has = stored !== null || cv === '1' || cv === 'true' || cv === '0' || cv === 'false'
    decidedRef.current = has
    setDecided(has)
  }, [cookieName])

  const setBehavioral = useCallback((v: boolean) => {
    try {
      setBehavioralState(v)
      setCookie(cookieName, v ? '1' : '0', 365)
      window.localStorage.setItem('hretheum:consent:behavioral', v ? '1' : '0')
      ;(window as any).hretheumConsent = { behavioral: v }
      window.dispatchEvent(new Event('hre:consent-changed'))
      decidedRef.current = true
      setDecided(true)
    } catch {}
  }, [cookieName])

  useEffect(() => {
    const handler = () => {
      try {
        const w: any = window
        if (w && w.hretheumConsent && typeof w.hretheumConsent.behavioral === 'boolean') {
          setBehavioralState(!!w.hretheumConsent.behavioral)
          setDecided(true)
          return
        }
        const stored = readStored()
        if (stored !== null) {
          setBehavioralState(stored)
          setDecided(true)
          return
        }
        const cv = getCookie(cookieName)
        if (cv === '1' || cv === 'true' || cv === '0' || cv === 'false') setDecided(true)
        if (cv === '1' || cv === 'true') setBehavioralState(true)
        if (cv === '0' || cv === 'false') setBehavioralState(false)
      } catch {}
    }
    window.addEventListener('hre:consent-changed', handler as EventListener)
    return () => window.removeEventListener('hre:consent-changed', handler as EventListener)
  }, [cookieName])

  return { behavioral, decided, setBehavioral }
}
