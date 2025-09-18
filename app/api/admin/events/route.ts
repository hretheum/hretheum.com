import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

async function getUserEmail(): Promise<string | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

function isAllowed(email: string | null): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (allow.length === 0) return false;
  return allow.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    let email: string | null = null;
    try {
      email = await getUserEmail();
    } catch (e: any) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin.events] getUserEmail failed:', e?.message || e);
      return NextResponse.json({ error: 'auth_error', message: 'Failed to resolve user session' }, { status: 401, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    if (!email) {
      return NextResponse.json({ error: 'auth_error', message: 'No active session' }, { status: 401, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    if (!isAllowed(email)) {
      return NextResponse.json({ error: 'forbidden', email }, { status: 403, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const type = searchParams.get('type'); // optional filter
    const sessionId = searchParams.get('session_id'); // optional filter

    const supabase = getServiceClient();

    // If type filter is set, keep simple flat pagination over that type
    if (type) {
      let q = supabase
        .from('chat_events')
        .select('id, parent_id, thread_id, turn_index, created_at, session_id, type, message, intent, confidence, timings, meta', { count: 'exact' })
        .eq('type', type)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (sessionId) q = q.eq('session_id', sessionId);
      const { data, error, count } = await q;
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[admin.events] query error:', error.message || error);
        return NextResponse.json({ error: 'fetch_failed', message: process.env.NODE_ENV !== 'production' ? (error.message || String(error)) : undefined }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
      }
      return NextResponse.json({ items: data ?? [], total: count ?? 0, offset, limit }, { status: 200, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }

    // No type filter: paginate by user_message turns, then include matching assistant_answer by parent_id
    let userQuery = supabase
      .from('chat_events')
      .select('id, parent_id, thread_id, turn_index, created_at, session_id, type, message, intent, confidence, timings, meta', { count: 'exact' })
      .eq('type', 'user_message')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (sessionId) userQuery = userQuery.eq('session_id', sessionId);
    const { data: users, error: userErr, count: userCount } = await userQuery;
    if (userErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin.events] user_query error:', userErr.message || userErr);
      return NextResponse.json({ error: 'fetch_failed', message: process.env.NODE_ENV !== 'production' ? (userErr.message || String(userErr)) : undefined }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }

    const ids = (users ?? []).map((u) => u.id);
    let assistants: any[] = [];
    let aErrMsg: string | null = null;
    if (ids.length > 0) {
      // 1) Primary: assistants linked by parent_id
      let aQuery = supabase
        .from('chat_events')
        .select('id, parent_id, thread_id, turn_index, created_at, session_id, type, message, intent, confidence, timings, meta')
        .eq('type', 'assistant_answer')
        .in('parent_id', ids);
      if (sessionId) aQuery = aQuery.eq('session_id', sessionId);
      const { data: aRows, error: aErr } = await aQuery;
      if (aErr) {
        aErrMsg = aErr.message || String(aErr);
        if (process.env.NODE_ENV !== 'production') console.error('[admin.events] assistant_query(parent) error:', aErrMsg);
      } else if (aRows) {
        assistants = aRows;
      }

      // 2) Fallback for legacy data: also fetch assistants by session_id and recent created_at
      const sessionIds = Array.from(new Set((users ?? []).map((u) => u.session_id)));
      if (sessionIds.length > 0) {
        const oldestUser = (users ?? []).reduce((min: string, u: any) => (u.created_at < min ? u.created_at : min), users![0].created_at);
        let afQuery = supabase
          .from('chat_events')
          .select('id, parent_id, thread_id, turn_index, created_at, session_id, type, message, intent, confidence, timings, meta')
          .eq('type', 'assistant_answer')
          .in('session_id', sessionIds)
          .gte('created_at', oldestUser);
        const { data: afRows, error: afErr } = await afQuery;
        if (afErr) {
          if (process.env.NODE_ENV !== 'production') console.error('[admin.events] assistant_query(fallback) error:', afErr.message || afErr);
        } else if (afRows && afRows.length) {
          // merge unique by id
          const known = new Set(assistants.map((r: any) => r.id));
          for (const r of afRows) if (!known.has(r.id)) assistants.push(r);
        }
      }
    }

    const items = [...(users ?? []), ...assistants];
    return NextResponse.json({ items, total: userCount ?? 0, offset, limit }, { status: 200, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') console.error('[admin.events] unexpected:', e?.message || e);
    return NextResponse.json({ error: 'unexpected', message: process.env.NODE_ENV !== 'production' ? (e?.message || String(e)) : undefined }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
  }
}
