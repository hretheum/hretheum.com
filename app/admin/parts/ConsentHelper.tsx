"use client";
// Admin-only helper to manage analytics consent cookie and emit change events.
// Exposes window.hreSetConsent(value:boolean, opts?:{persistDays?:number}) and renders a tiny UI.
// Documentation lives in docs/aui/REDIRECT_TELEMETRY_CONSENT.md

import React, { useEffect, useMemo, useState } from 'react';

declare global {
  // Optional typing for the helper (not required to compile)
  interface Window {
    hreSetConsent?: (value: boolean, opts?: { persistDays?: number }) => boolean;
  }
}

const CONSENT_COOKIE = process.env.NEXT_PUBLIC_CONSENT_COOKIE_NAME || 'hre_consent_analytics';
const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || '';

function getCookie(name: string): string | null {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()\[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function computeDomain(): string | undefined {
  try {
    const host = window.location.hostname;
    if (APEX_DOMAIN && (host === APEX_DOMAIN || host.endsWith('.' + APEX_DOMAIN))) return APEX_DOMAIN;
    // Fallback: current host (useful on localhost or preview)
    return host;
  } catch {
    return undefined;
  }
}

function setConsentCookie(value: boolean, persistDays = 365) {
  const domain = computeDomain();
  const maxAge = value ? persistDays * 24 * 60 * 60 : 0;
  const v = value ? '1' : '0';
  let cookie = `${CONSENT_COOKIE}=${encodeURIComponent(v)}; Path=/; SameSite=Lax; Secure`;
  if (domain) cookie += `; Domain=${domain}`;
  if (value) cookie += `; Max-Age=${maxAge}`; else cookie += `; Max-Age=0`;
  document.cookie = cookie;
}

export default function ConsentHelper() {
  const [hasConsent, setHasConsent] = useState<boolean>(() => {
    const v = getCookie(CONSENT_COOKIE);
    return v === '1' || v === 'true';
  });

  useEffect(() => {
    // expose helper in admin only
    window.hreSetConsent = (val: boolean, opts?: { persistDays?: number }) => {
      try {
        setConsentCookie(val, opts?.persistDays ?? 365);
        setHasConsent(val);
        // Emit both events so listeners can hook either
        window.dispatchEvent(new Event('hre:consent-changed'));
        window.dispatchEvent(new Event('consent-changed'));
        return true;
      } catch {
        return false;
      }
    };
    return () => {
      try { delete window.hreSetConsent; } catch {}
    };
  }, []);

  const desc = useMemo(() => {
    const d = computeDomain();
    return `Cookie ${CONSENT_COOKIE} on ${d || '(host)'} = ${hasConsent ? '1' : '0'}`;
  }, [hasConsent]);

  return (
    <div className="mt-2 rounded-md border p-2 text-xs text-gray-700 bg-white">
      <div className="flex items-center gap-2">
        <div className="font-medium">Consent</div>
        <div className={`inline-flex items-center rounded px-2 py-0.5 ${hasConsent ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
          {hasConsent ? 'granted' : 'denied'}
        </div>
        <div className="ml-auto" />
        <button
          className="rounded border px-2 py-0.5 hover:bg-gray-50"
          onClick={() => window.hreSetConsent?.(true)}
        >Grant</button>
        <button
          className="rounded border px-2 py-0.5 hover:bg-gray-50"
          onClick={() => window.hreSetConsent?.(false)}
        >Revoke</button>
      </div>
      <div className="mt-1 text-gray-500">{desc}</div>
      <div className="mt-1 text-gray-500">Helper: <span className="font-mono">window.hreSetConsent(true|false)</span></div>
    </div>
  );
}
