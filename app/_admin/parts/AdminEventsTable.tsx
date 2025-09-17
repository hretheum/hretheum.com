"use client";
import React, { useEffect, useMemo, useState } from 'react';

type EventRow = {
  id: string;
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
  const headers = [
    'id',
    'created_at',
    'session_id',
    'type',
    'message',
    'intent',
    'confidence',
    'ip',
    'user_agent',
  ];
  const esc = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    const needs = /[",\n]/.test(s);
    const safe = s.replace(/"/g, '""');
    return needs ? `"${safe}"` : safe;
  };
  const lines = [headers.join(',')];
  for (const r of items) {
    const row = [
      r.id,
      r.created_at,
      r.session_id,
      r.type,
      r.message,
      r.intent ?? '',
      r.confidence ?? '',
      r.meta?.ip ?? '',
      r.meta?.user_agent ?? '',
    ].map(esc);
    lines.push(row.join(','));
  }
  return lines.join('\n');
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

function toCSV(items: EventRow[]): string {
  const headers = [
    'id',
    'created_at',
    'session_id',
    'type',
    'message',
    'intent',
    'confidence',
    'ip',
    'user_agent',
  ];
  const esc = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    // Escape double quotes by doubling them, wrap in quotes if contains comma, quote or newline
    const needs = /[",\n]/.test(s);
    const safe = s.replace(/"/g, '""');
    return needs ? `"${safe}"` : safe;
  };
  const lines = [headers.join(',')];
  for (const r of items) {
    const row = [
      r.id,
      r.created_at,
      r.session_id,
      r.type,
      r.message,
      r.intent ?? '',
      r.confidence ?? '',
      r.meta?.ip ?? '',
      r.meta?.user_agent ?? '',
    ].map(esc);
    lines.push(row.join(','));
  }
  return lines.join('\n');
}
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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
        <span className="ml-auto text-gray-600">{loading ? 'Loading…' : `${total} items`}</span>
        <button
          className="rounded-md border px-2 py-1 disabled:opacity-50"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              // Fetch up to 1000 rows with current filters for export
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

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-2 py-2 text-left">created_at</th>
              <th className="px-2 py-2 text-left">session_id</th>
              <th className="px-2 py-2 text-left">type</th>
              <th className="px-2 py-2 text-left">message</th>
              <th className="px-2 py-2 text-left">intent</th>
              <th className="px-2 py-2 text-left">conf</th>
              <th className="px-2 py-2 text-left">ip</th>
              <th className="px-2 py-2 text-left">ua</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50 align-top">
                <td className="px-2 py-1 text-gray-800 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-2 py-1 text-gray-600 whitespace-nowrap">{r.session_id}</td>
                <td className="px-2 py-1 text-gray-600 whitespace-nowrap">{r.type}</td>
                <td className="px-2 py-1 text-gray-900">
                  <div className="max-w-[520px] truncate" title={r.message}>{r.message}</div>
                </td>
                <td className="px-2 py-1 text-gray-600 whitespace-nowrap">{r.intent ?? ''}</td>
                <td className="px-2 py-1 text-gray-600 whitespace-nowrap">{r.confidence != null ? Number(r.confidence).toFixed(3) : ''}</td>
                <td className="px-2 py-1 text-gray-600 whitespace-nowrap">{(r.meta?.ip) ?? ''}</td>
                <td className="px-2 py-1 text-gray-600">
                  <div className="max-w-[320px] truncate" title={r.meta?.user_agent}>{r.meta?.user_agent ?? ''}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <button
          className="rounded-md border px-2 py-1 disabled:opacity-50"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          Prev
        </button>
        <div className="text-gray-600">Page {page} / {pages}</div>
        <button
          className="rounded-md border px-2 py-1 disabled:opacity-50"
          disabled={offset + limit >= total}
          onClick={() => setOffset(offset + limit)}
        >
          Next
        </button>
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
