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
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <button onClick={signIn} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
      Sign in with Google
    </button>
  );
}
