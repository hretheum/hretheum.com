"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Bridges client-side Supabase session (localStorage) into server HttpOnly cookies
// so that Server Components and Route Handlers can see the authenticated user.
export default function AdminSessionBridge() {
  const [synced, setSynced] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true } }
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sess = data.session;
        if (!sess) return;
        // Ask server to set HttpOnly cookies for this session
        const res = await fetch('/auth/session-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: sess.access_token, refresh_token: sess.refresh_token }),
          credentials: 'include',
        });
        if (res.ok && mounted) {
          setSynced(true);
          // Reload once to let server pick up the cookies
          if (typeof window !== 'undefined') window.location.reload();
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
