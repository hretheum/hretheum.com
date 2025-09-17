"use client";
import { createClient } from '@supabase/supabase-js';

export default function AdminSignIn() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true } }
  );

  async function signIn() {
    const next = '/admin';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Force canonical base on production to avoid www/non-www mismatches in Supabase redirect allowlist
    const isProd = origin.includes('hretheum.com');
    const redirectBase = isProd ? 'https://hretheum.com' : origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectBase}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: 'openid profile email',
      },
    });
  }

  return (
    <button onClick={signIn} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
      Sign in with Google
    </button>
  );
}
