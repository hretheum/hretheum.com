"use client";
import React, { useCallback, useEffect, useState } from 'react';

type RumMetric = {
  metric: string;
  count: number;
  p50: number | null;
  p95: number | null;
};

type RumSummary = {
  total: number;
  days: number;
  byMetric: RumMetric[];
  byRoute: { route: string; count: number }[];
  byBrand: { brand: string; count: number }[];
  byDay: { date: string; count: number }[];
};

export default function RumDashboard() {
  const [data, setData] = useState<RumSummary | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rum?days=${days}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const json: RumSummary = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mt-8 rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold">RUM Dashboard</h2>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span>Window:</span>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} className="border rounded px-2 py-1">
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <button className="border rounded px-2 py-1" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>

      {!data ? (
        <div className="text-sm text-gray-600">No data</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Total events</div>
              <div className="text-2xl font-semibold">{data.total}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Top routes</div>
              <ul className="mt-1 text-sm space-y-1">
                {data.byRoute.slice(0, 5).map((r) => (
                  <li key={r.route} className="flex justify-between"><span className="font-mono">{r.route}</span><span>{r.count}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Top brands</div>
              <ul className="mt-1 text-sm space-y-1">
                {data.byBrand.slice(0, 5).map((r) => (
                  <li key={r.brand} className="flex justify-between"><span className="truncate max-w-[220px]" title={r.brand}>{r.brand}</span><span>{r.count}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Daily events</div>
            <div className="flex items-end gap-1">
              {data.byDay.map((d) => (
                <div key={d.date} className="bg-green-500/20" style={{ height: `${Math.min(120, 8 + d.count * 4)}px`, width: '12px' }} title={`${d.date}: ${d.count}`} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">Core Web Vitals</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.byMetric.map((m) => (
                <div key={m.metric} className="rounded border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{m.metric}</span>
                    <span className="text-xs text-gray-500">{m.count} samples</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs">
                      <span className="text-gray-500">p50</span>
                      <span className="font-mono">{m.p50 ?? '—'} ms</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs">
                      <span className="text-gray-500">p95</span>
                      <span className="font-mono">{m.p95 ?? '—'} ms</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}