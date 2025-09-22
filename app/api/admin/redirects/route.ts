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
      if (process.env.NODE_ENV !== 'production') console.error('[admin.redirects] getUserEmail failed:', e?.message || e);
      return NextResponse.json({ error: 'auth_error', message: 'Failed to resolve user session' }, { status: 401, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    if (!email) {
      return NextResponse.json({ error: 'auth_error', message: 'No active session' }, { status: 401, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    if (!isAllowed(email)) {
      return NextResponse.json({ error: 'forbidden', email }, { status: 403, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }

    const { searchParams } = new URL(req.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10), 1), 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceIso = since.toISOString();

    const svc = getServiceClient();
    const { data, error } = await svc
      .from('redirect_events')
      .select('created_at, source_host, dest_slug, meta')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(20000);

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin.redirects] query error:', error.message || error);
      return NextResponse.json({ error: 'fetch_failed' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
    }

    const rows = data || [];
    const total = rows.length;

    // Aggregate by slug
    const bySlugMap = new Map<string, number>();
    for (const r of rows) {
      const k = (r as any).dest_slug || '(none)';
      bySlugMap.set(k, (bySlugMap.get(k) || 0) + 1);
    }
    const bySlug = Array.from(bySlugMap.entries()).map(([slug, count]) => ({ slug, count })).sort((a, b) => b.count - a.count).slice(0, 20);

    // Aggregate by source_host
    const bySourceMap = new Map<string, number>();
    for (const r of rows) {
      const k = (r as any).source_host || '(unknown)';
      bySourceMap.set(k, (bySourceMap.get(k) || 0) + 1);
    }
    const bySource = Array.from(bySourceMap.entries()).map(([host, count]) => ({ host, count })).sort((a, b) => b.count - a.count).slice(0, 20);

    // Aggregate by day
    const byDayMap = new Map<string, number>();
    for (const r of rows) {
      const d = new Date((r as any).created_at);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
      byDayMap.set(key, (byDayMap.get(key) || 0) + 1);
    }
    const byDay = Array.from(byDayMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => (a.date < b.date ? -1 : 1));

    // Latency stats from meta.mw_ms
    const mws: number[] = [];
    for (const r of rows) {
      const v = (r as any)?.meta?.mw_ms;
      if (typeof v === 'number' && isFinite(v) && v >= 0) mws.push(Math.floor(v));
    }
    mws.sort((a, b) => a - b);
    const q = (p: number) => {
      if (mws.length === 0) return null as number | null;
      const idx = Math.min(mws.length - 1, Math.max(0, Math.round((p / 100) * (mws.length - 1))));
      return mws[idx];
    };
    const threshold = Number.parseInt(process.env.REDIRECT_MW_P95_THRESHOLD_MS || '5', 10);
    const p95 = q(95);
    const mwStats = { count: mws.length, p50: q(50), p95 };
    const mwPass95 = p95 == null ? null : p95 <= threshold;

    // Redirect correctness
    const apex = (process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com').toLowerCase();
    const isApexHost = (h: string) => h.toLowerCase().endsWith('.' + apex);
    const normalize = (label: string): string | null => {
      if (!label) return null;
      const lower = label.toLowerCase();
      if (lower.startsWith('xn--')) return null;
      let cleaned = lower.replace(/[^a-z0-9-]/g, '');
      cleaned = cleaned.replace(/-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
      if (!cleaned) return null;
      if (cleaned.length > 63) return null;
      if (!/^[a-z0-9-]{1,63}$/.test(cleaned)) return null;
      return cleaned;
    };
    let eligible = 0;
    let correct = 0;
    for (const r of rows as any[]) {
      const sh: string = r.source_host || '';
      if (!isApexHost(sh)) continue;
      // extract labels before apex
      const parts = sh.split('.');
      const apexParts = apex.split('.');
      if (parts.length <= apexParts.length) continue;
      const subParts = parts.slice(0, parts.length - apexParts.length);
      eligible++;
      if (subParts.length !== 1) {
        // expected no slug
        if ((r.dest_slug || '') === '(none)') correct++;
        continue;
      }
      const expected = normalize(subParts[0]);
      if ((expected && r.dest_slug === expected) || (!expected && (r.dest_slug || '') === '(none)')) correct++;
    }
    const correctnessPct = eligible > 0 ? (correct / eligible) * 100 : null;
    const corrThreshold = Number.parseFloat(process.env.REDIRECT_CORRECTNESS_THRESHOLD_PCT || '99.9');
    const correctnessPass = correctnessPct == null ? null : correctnessPct >= corrThreshold;

    // Error rate via Vercel drain events (5xx / total)
    let errorRatePct: number | null = null;
    let errorRatePass: boolean | null = null;
    let errorCount: number | null = null;
    let totalDrainCount: number | null = null;
    try {
      const drainBase = svc.from('vercel_drain_events').select('*', { count: 'exact', head: true }).gte('created_at', sinceIso);
      const { count: totalCount, error: e1 } = await drainBase;
      if (e1) throw e1;
      totalDrainCount = totalCount ?? 0;
      const { count: errCount, error: e2 } = await svc
        .from('vercel_drain_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sinceIso)
        .gte('status', 500)
        .lt('status', 600);
      if (e2) throw e2;
      errorCount = errCount ?? 0;
      if ((totalDrainCount || 0) > 0) {
        errorRatePct = (Number(errorCount) / Number(totalDrainCount)) * 100;
        const errThr = Number.parseFloat(process.env.REDIRECT_ERROR_RATE_THRESHOLD_PCT || '0.1');
        errorRatePass = errorRatePct <= errThr;
      }
    } catch (e: any) {
      if (process.env.NODE_ENV !== 'production') console.warn('[admin.redirects] drain stats failed:', e?.message || e);
    }

    return NextResponse.json({ total, days, bySlug, bySource, byDay, mwStats, mwPass95, mwThresholdMs: threshold, correctness: { eligible, correct, pct: correctnessPct }, correctnessPass, correctnessThresholdPct: corrThreshold, errorRate: { total: totalDrainCount, errors: errorCount, pct: errorRatePct }, errorRatePass }, { status: 200, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') console.error('[admin.redirects] unexpected:', e?.message || e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
  }
}
