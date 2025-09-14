// Supabase server client for Next.js (Server Components / Route Handlers)
// Comments in English per project rules.

'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function createClient(): Promise<SupabaseClient> {
  // In Next 15, cookies() may return a Promise in some server contexts (e.g., Server Actions)
  const cookieStore: any = await (cookies() as any);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieStore?.get?.(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // Mutating cookies is supported in Server Components on Next 15.
          // In unsupported contexts, no-op.
          cookieStore?.set?.({ name, value, ...options });
        } catch {
          /* no-op */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore?.set?.({ name, value: '', ...options, maxAge: 0 });
        } catch {
          /* no-op */
        }
      },
    },
  });

  return client;
}
