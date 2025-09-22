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
    // auth
    let email: string | null = null;
    try {
      email = await getUserEmail();
    } catch (e: any) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin.redirects.raw] getUserEmail failed:', e?.message || e);
      return NextResponse.json({ error: 'auth_error', message: 'Failed to resolve user session' }, { status: 401, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    if (!email) return NextResponse.json({ error: 'auth_error', message: 'No active session' }, { status: 401, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    if (!isAllowed(email)) return NextResponse.json({ error: 'forbidden', email }, { status: 403, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const slug = (searchParams.get('slug') || '').trim();
    const host = (searchParams.get('host') || '').trim();
    const since = (searchParams.get('since') || '').trim();
    const until = (searchParams.get('until') || '').trim();

    const svc = getServiceClient();
    let q = svc
      .from('redirect_events')
      .select('id, created_at, source_host, dest_slug, referer, user_agent, meta', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (slug) q = q.ilike('dest_slug', slug.replace(/\*/g, '%'));
    if (host) q = q.ilike('source_host', host.replace(/\*/g, '%'));
    if (since) q = q.gte('created_at', new Date(since).toISOString());
    if (until) q = q.lte('created_at', new Date(until).toISOString());

    const { data, error, count } = await q;
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin.redirects.raw] query error:', error.message || error);
      return NextResponse.json({ error: 'fetch_failed' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }

    return NextResponse.json({ items: data ?? [], total: count ?? 0, offset, limit }, { status: 200, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') console.error('[admin.redirects.raw] unexpected:', e?.message || e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
  }
}
