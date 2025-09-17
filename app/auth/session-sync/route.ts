import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { access_token, refresh_token } = await req.json();
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[auth.session-sync] setSession error:', error.message || error);
      return NextResponse.json({ error: 'set_session_failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') console.error('[auth.session-sync] unexpected:', e?.message || e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
