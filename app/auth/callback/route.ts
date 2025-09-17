import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Exchange the auth code for a session and set cookies via createServerClient
  const { searchParams } = new URL(req.url);
  const next = searchParams.get('next') || '/admin';
  const code = searchParams.get('code');
  const supabase = await createClient();

  try {
    if (code) {
      if (process.env.NODE_ENV !== 'production') console.log('[auth.callback] exchanging code');
      await supabase.auth.exchangeCodeForSession(code);
    }
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') console.error('OAuth callback error:', e?.message || e);
  }

  return NextResponse.redirect(new URL(next, req.url));
}
