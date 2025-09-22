"use client";
// Client-side redirect logging beacon.
// Posts to /api/metrics/redirect once on mount. Server route clears the cookie to avoid duplicates.

import { useCallback, useEffect, useRef } from 'react';

export default function RedirectBeacon() {
  const sent = useRef(false);
  const lastConsentRef = useRef<boolean>(false);
  const pollTimerRef = useRef<number | null>(null);
  const pollStopRef = useRef<number | null>(null);

  const hasConsentNow = useCallback((): boolean => {
    try {
      const consentCookie = process.env.NEXT_PUBLIC_CONSENT_COOKIE_NAME || 'hre_consent_analytics';
      const cookies = (typeof document !== 'undefined' ? document.cookie : '') || '';
      const m = cookies.match(new RegExp(`(?:^|; )${consentCookie}=([^;]*)`));
      const v = m ? decodeURIComponent(m[1]) : '';
      return v === '1' || v === 'true';
    } catch {
      return false;
    }
  }, []);

  const canSend = useCallback((): boolean => {
    const requiresConsent = (process.env.NEXT_PUBLIC_REDIRECT_BEACON_REQUIRES_CONSENT ?? 'true') !== 'false';
    return !requiresConsent || hasConsentNow();
  }, [hasConsentNow]);

  const sendOnce = useCallback(() => {
    if (sent.current) return;
    if (!canSend()) return;
    sent.current = true;
    fetch('/api/metrics/redirect', { method: 'POST', cache: 'no-store' }).catch(() => {});
  }, [canSend]);

  useEffect(() => {
    // initial try on mount
    lastConsentRef.current = hasConsentNow();
    sendOnce();

    // event listener approach: custom events from consent manager
    const handler = () => {
      lastConsentRef.current = hasConsentNow();
      sendOnce();
    };
    window.addEventListener('hre:consent-changed', handler as EventListener);
    window.addEventListener('consent-changed', handler as EventListener);

    // fallback polling for up to 2 minutes to catch async consent set after UI interaction
    pollTimerRef.current = window.setInterval(() => {
      const now = hasConsentNow();
      if (now && !lastConsentRef.current) {
        lastConsentRef.current = now;
        sendOnce();
      }
      // stop early if already sent
      if (sent.current) {
        if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }, 1500) as unknown as number;
    pollStopRef.current = window.setTimeout(() => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }, 120000) as unknown as number; // 2 minutes

    return () => {
      window.removeEventListener('hre:consent-changed', handler as EventListener);
      window.removeEventListener('consent-changed', handler as EventListener);
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      if (pollStopRef.current) window.clearTimeout(pollStopRef.current);
      pollTimerRef.current = null;
      pollStopRef.current = null;
    };
  }, [hasConsentNow, sendOnce]);
  return null;
}
