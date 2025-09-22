"use client";
import React, { useEffect, useMemo, useState } from 'react';

type Row = {
  id: string;
  created_at: string;
  source_host: string;
  dest_slug: string;
  referer: string | null;
  user_agent: string | null;
  meta: any | null;
};

type ApiResp = { items: Row[]; total: number; offset: number; limit: number };

export default function RedirectsRawTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [slug, setSlug] = useState('');
  const [host, setHost] = useState('');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [loading, setLoading] = useState(false);

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('limit', String(limit));
    sp.set('offset', String(offset));
    if (slug) sp.set('slug', slug);
    if (host) sp.set('host', host);
    if (since) sp.set('since', since);
    if (until) sp.set('until', until);
    return sp.toString();
  }, [limit, offset, slug, host, since, until]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/redirects/raw?${query}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const data: ApiResp = await res.json();
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [query]);

  return (
    <div className="mt-6">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-600">Slug</span>
          <input value={slug} onChange={(e) => { setOffset(0); setSlug(e.target.value); }} placeholder="e.g., zendesk or z*" className="border rounded-md px-2 py-1" />
        </label>
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-600">Host</span>
          <input value={host} onChange={(e) => { setOffset(0); setHost(e.target.value); }} placeholder="e.g., *.hretheum.com" className="border rounded-md px-2 py-1" />
        </label>
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-600">Since</span>
          <input type="date" value={since} onChange={(e) => { setOffset(0); setSince(e.target.value); }} className="border rounded-md px-2 py-1" />
        </label>
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-600">Until</span>
          <input type="date" value={until} onChange={(e) => { setOffset(0); setUntil(e.target.value); }} className="border rounded-md px-2 py-1" />
        </label>
        <div className="ml-auto text-gray-600">{loading ? 'Loading…' : `${total} items`}</div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-2 py-1 text-left">Created</th>
              <th className="px-2 py-1 text-left">Source host</th>
              <th className="px-2 py-1 text-left">Slug</th>
              <th className="px-2 py-1 text-left">Referer</th>
              <th className="px-2 py-1 text-left">User-Agent</th>
              <th className="px-2 py-1 text-left">mw_ms</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-2 py-1 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-2 py-1">{r.source_host}</td>
                <td className="px-2 py-1 font-mono">{r.dest_slug}</td>
                <td className="px-2 py-1 truncate max-w-[260px]" title={r.referer || ''}>{r.referer || ''}</td>
                <td className="px-2 py-1 truncate max-w-[360px]" title={r.user_agent || ''}>{r.user_agent || ''}</td>
                <td className="px-2 py-1">{(r.meta && typeof r.meta.mw_ms === 'number') ? Math.floor(r.meta.mw_ms) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
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
