"use client";
import React, { useEffect, useMemo, useState } from 'react';

type EventRow = {
  id: string;
  parent_id?: string | null;
  created_at: string;
  session_id: string;
  type: 'user_message' | 'assistant_answer';
  message: string;
  intent: string | null;
  confidence: number | null;
  timings: any | null;
  meta: any | null;
};

type ApiResp = { items: EventRow[]; total: number; offset: number; limit: number };

function toCSV(items: EventRow[]): string {
  const headers = ['id','created_at','session_id','type','message','intent','confidence','ip','user_agent'];
  const esc = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    const needs = /[",\n]/.test(s);
    const safe = s.replace(/"/g, '""');
    return needs ? `"${safe}"` : safe;
  };
  const lines = [headers.join(',')];
  for (const r of items) {
    const row = [r.id,r.created_at,r.session_id,r.type,r.message,r.intent ?? '',r.confidence ?? '',r.meta?.ip ?? '',r.meta?.user_agent ?? ''].map(esc);
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

type Pair = {
  session_id: string;
  created_at: string; // from user message
  user: EventRow;
  assistant?: EventRow | null;
  assistantTimePaired?: boolean; // true when matched by time (no parent_id)
};

function groupPairs(rows: EventRow[]): Pair[] {
  const users: EventRow[] = [];
  const assistants: EventRow[] = [];
  for (const r of rows) {
    if (r.type === 'user_message') users.push(r);
    else if (r.type === 'assistant_answer') assistants.push(r);
  }

  // Index assistants by parent_id
  const byParent = new Map<string, EventRow>();
  for (const a of assistants) {
    if (a.parent_id) byParent.set(a.parent_id, a);
  }
  // Also index assistants per session sorted by created_at for legacy rows without parent_id
  const bySession = new Map<string, EventRow[]>();
  for (const a of assistants) {
    const arr = bySession.get(a.session_id) || [];
    arr.push(a);
    bySession.set(a.session_id, arr);
  }
  for (const [sid, arr] of bySession.entries()) {
    arr.sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());
  }
  const usedAssistants = new Set<string>();

  const result: Pair[] = [];
  for (const u of users) {
    // 1) Prefer strict parent_id link
    let a: EventRow | null | undefined = byParent.get(u.id);
    if (a && !usedAssistants.has(a.id)) {
      usedAssistants.add(a.id);
      result.push({ session_id: u.session_id, created_at: u.created_at, user: u, assistant: a, assistantTimePaired: false });
      continue;
    }
    // 2) Fallback: same session, nearest assistant around user.created_at not yet used
    const sessList = bySession.get(u.session_id) || [];
    const uTime = new Date(u.created_at).getTime();
    const WINDOW_MS = 10 * 60 * 1000; // 10 minutes window
    let best: EventRow | null = null;
    let bestDelta = Number.POSITIVE_INFINITY;
    // Prefer future first; if none within window, allow past
    for (const phase of ['future', 'past'] as const) {
      for (const cand of sessList) {
        if (usedAssistants.has(cand.id)) continue;
        const cTime = new Date(cand.created_at).getTime();
        const delta = Math.abs(cTime - uTime);
        if (delta > WINDOW_MS) continue;
        if (phase === 'future' && cTime < uTime) continue;
        if (phase === 'past' && cTime >= uTime) continue;
        if (delta < bestDelta) {
          best = cand;
          bestDelta = delta;
        }
      }
      if (best) break;
    }
    if (best) usedAssistants.add(best.id);
    result.push({ session_id: u.session_id, created_at: u.created_at, user: u, assistant: best, assistantTimePaired: !!best && !best.parent_id });
  }
  return result;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - that.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === 2) return 'Day before yesterday';
  return that.toLocaleDateString();
}

export default function AdminEventsTable() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [type, setType] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at'|'user_message'|'intent'|'confidence'>('created_at');
  const [sortDir, setSortDir] = useState<'desc'|'asc'>('desc');
  const [q, setQ] = useState<string>('');

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('limit', String(limit));
    sp.set('offset', String(offset));
    if (type) sp.set('type', type);
    if (sessionId) sp.set('session_id', sessionId);
    return sp.toString();
  }, [limit, offset, type, sessionId]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events?${query}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load events');
      const data: ApiResp = await res.json();
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const pairs = useMemo(() => {
    let list = groupPairs(rows);
    // mini search filter (case-insensitive) across user/assistant message and intent
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((p) => {
        const um = p.user.message?.toLowerCase() || '';
        const am = p.assistant?.message?.toLowerCase() || '';
        const it = (p.assistant?.intent || p.user.intent || '').toLowerCase();
        return um.includes(needle) || am.includes(needle) || it.includes(needle);
      });
    }
    // sorting
    const sorted = [...list].sort((a, b) => {
      const av = (() => {
        switch (sortBy) {
          case 'created_at': return new Date(a.created_at).getTime();
          case 'user_message': return a.user.message || '';
          case 'intent': return (a.assistant?.intent || a.user.intent || '') as any;
          case 'confidence': return (a.assistant?.confidence ?? a.user.confidence ?? -1) as any;
        }
      })();
      const bv = (() => {
        switch (sortBy) {
          case 'created_at': return new Date(b.created_at).getTime();
          case 'user_message': return b.user.message || '';
          case 'intent': return (b.assistant?.intent || b.user.intent || '') as any;
          case 'confidence': return (b.assistant?.confidence ?? b.user.confidence ?? -1) as any;
        }
      })();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rows, sortBy, sortDir]);

  // group by date label
  const groups = useMemo(() => {
    const m = new Map<string, Pair[]>();
    for (const p of pairs) {
      const key = dateLabel(p.created_at);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    return Array.from(m.entries());
  }, [pairs]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-600">Type</span>
          <select value={type} onChange={(e) => { setOffset(0); setType(e.target.value); }} className="border rounded-md px-2 py-1">
            <option value="">all</option>
            <option value="user_message">user_message</option>
            <option value="assistant_answer">assistant_answer</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-600">Session</span>
          <input value={sessionId} onChange={(e) => { setOffset(0); setSessionId(e.target.value); }} placeholder="session_id" className="border rounded-md px-2 py-1" />
        </label>
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-600">Search</span>
          <input
            value={q}
            onChange={(e) => { setOffset(0); setQ(e.target.value); }}
            placeholder="text or intent"
            className="border rounded-md px-2 py-1"
          />
        </label>
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-600">Sort by</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border rounded-md px-2 py-1">
            <option value="created_at">created_at</option>
            <option value="user_message">user_message</option>
            <option value="intent">intent</option>
            <option value="confidence">confidence</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as any)} className="border rounded-md px-2 py-1">
            <option value="desc">desc</option>
            <option value="asc">asc</option>
          </select>
        </label>
        <span className="ml-auto text-gray-600">{loading ? 'Loading…' : `${total} items`}</span>
        <button
          className="rounded-md border px-2 py-1 disabled:opacity-50"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              const sp = new URLSearchParams();
              sp.set('limit', '1000');
              sp.set('offset', '0');
              if (type) sp.set('type', type);
              if (sessionId) sp.set('session_id', sessionId);
              const res = await fetch(`/api/admin/events?${sp.toString()}`, { cache: 'no-store' });
              if (!res.ok) throw new Error('Failed to export');
              const data: ApiResp = await res.json();
              const csv = toCSV(data.items);
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `chat_events_export_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) {
              console.error(e);
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Grouped card view */}
      <div className="space-y-6">
        {groups.map(([label, items]) => (
          <div key={label}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
            <div className="space-y-3">
              {items.map((p) => (
                <div key={p.user.id} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                    <div className="font-medium text-gray-800">{new Date(p.created_at).toLocaleString()}</div>
                    <div className="truncate">Session: <span className="font-mono">{p.session_id}</span></div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">User</div>
                      <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">{p.user.message}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">Assistant</div>
                      <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">{p.assistant?.message ?? ''}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <div>Intent: <span className="font-mono">{p.assistant?.intent ?? p.user.intent ?? ''}</span></div>
                    <div>Conf: <span className="font-mono">{p.assistant?.confidence != null ? p.assistant.confidence.toFixed(3) : (p.user.confidence != null ? p.user.confidence.toFixed(3) : '')}</span></div>
                    {p.assistant && p.assistantTimePaired && (
                      <div className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">paired by time</div>
                    )}
                    <div className="ml-auto" />
                    {p.user.meta?.ip && (
                      <div className="truncate" title={p.user.meta?.ip}>IP: {p.user.meta?.ip}</div>
                    )}
                    {p.user.meta?.user_agent && (
                      <div className="max-w-[360px] truncate" title={p.user.meta?.user_agent}>UA: {p.user.meta?.user_agent}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <button className="rounded-md border px-2 py-1 disabled:opacity-50" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Prev</button>
        <div className="text-gray-600">Page {page} / {pages}</div>
        <button className="rounded-md border px-2 py-1 disabled:opacity-50" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>Next</button>
        <div className="ml-auto" />
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-600">Per page</span>
          <select value={limit} onChange={(e) => { setOffset(0); setLimit(parseInt(e.target.value, 10)); }} className="border rounded-md px-2 py-1">
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>
    </div>
  );
}
