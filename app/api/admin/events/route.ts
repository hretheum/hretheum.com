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
      return NextResponse.json({ error: 'auth_error', message: 'Failed to resolve user session' }, { status: 401 });
    }
    if (!email) {
      return NextResponse.json({ error: 'auth_error', message: 'No active session' }, { status: 401 });
    }
    if (!isAllowed(email)) {
      return NextResponse.json({ error: 'forbidden', email }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const type = searchParams.get('type'); // optional filter
    const sessionId = searchParams.get('session_id'); // optional filter

    const supabase = getServiceClient();
    let query = supabase
      .from('chat_events')
      .select('id, created_at, session_id, type, message, intent, confidence, timings, meta', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);
    if (sessionId) query = query.eq('session_id', sessionId);

    const { data, error, count } = await query;
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin.events] query error:', error.message || error);
      return NextResponse.json({ error: 'fetch_failed', message: process.env.NODE_ENV !== 'production' ? (error.message || String(error)) : undefined }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [], total: count ?? 0, offset, limit });
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') console.error('[admin.events] unexpected:', e?.message || e);
    return NextResponse.json({ error: 'unexpected', message: process.env.NODE_ENV !== 'production' ? (e?.message || String(e)) : undefined }, { status: 500 });
  }
}
