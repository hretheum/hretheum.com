"use client";
// Client-side redirect logging beacon.
// Posts to /api/metrics/redirect once on mount. Server route clears the cookie to avoid duplicates.

import { useEffect, useRef } from 'react';

export default function RedirectBeacon() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    // Fire-and-forget; do not block rendering
    fetch('/api/metrics/redirect', { method: 'POST', cache: 'no-store' }).catch(() => {});
  }, []);
  return null;
}
