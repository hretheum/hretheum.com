import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    // session & meta
    const cookieStore = await (cookies() as any);
    const sessionId = cookieStore?.get?.('chat_session_id')?.value || null;
    const ua = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    const fwd = req.headers.get('x-forwarded-for') || '';
    const ip = fwd.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';

    const supabase = getSupabaseServer();

    // simple rate-limit: 1 request / 2 minutes per session_id
    if (sessionId) {
      const sinceIso = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { count, error: cntErr } = await supabase
        .from('chat_requests')
        .select('id', { head: true, count: 'exact' })
        .eq('session_id', sessionId)
        .gte('created_at', sinceIso);
      if (!cntErr && (count ?? 0) >= 1) {
        return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
      }
    }

    const { data, error } = await supabase
      .from('chat_requests')
      .insert({ session_id: sessionId, message, status: 'new', meta: { user_agent: ua, referer, ip } })
      .select('id')
      .single();
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[chat.request:error]', error.message || error);
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });
    }

    console.log('[chat.request:new]', { id: data?.id, session_id: sessionId });
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
