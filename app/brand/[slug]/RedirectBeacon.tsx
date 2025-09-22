"use client";
// Client-side redirect logging beacon.
// Posts to /api/metrics/redirect once on mount. Server route clears the cookie to avoid duplicates.

import { useEffect, useRef } from 'react';

export default function RedirectBeacon() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    const requiresConsent = (process.env.NEXT_PUBLIC_REDIRECT_BEACON_REQUIRES_CONSENT ?? 'true') !== 'false';
    const consentCookie = process.env.NEXT_PUBLIC_CONSENT_COOKIE_NAME || 'hre_consent_analytics';
    const hasConsent = (() => {
      try {
        const cookies = (typeof document !== 'undefined' ? document.cookie : '') || '';
        const m = cookies.match(new RegExp(`(?:^|; )${consentCookie}=([^;]*)`));
        const v = m ? decodeURIComponent(m[1]) : '';
        return v === '1' || v === 'true';
      } catch {
        return false;
      }
    })();
    if (!requiresConsent || hasConsent) {
      sent.current = true;
      // Fire-and-forget; do not block rendering
      fetch('/api/metrics/redirect', { method: 'POST', cache: 'no-store' }).catch(() => {});
    }
  }, []);
  return null;
}
