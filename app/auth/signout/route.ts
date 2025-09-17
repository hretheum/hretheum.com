import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[auth.signout] error:', error.message || error);
      return NextResponse.json({ error: 'signout_failed' }, { status: 500 });
    }
    const next = new URL(req.url).searchParams.get('next') || '/admin';
    return NextResponse.redirect(new URL(next, req.url));
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') console.error('[auth.signout] unexpected:', e?.message || e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
