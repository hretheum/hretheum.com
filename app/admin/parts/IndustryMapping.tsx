"use client";
import React, { useEffect, useState } from 'react'

type Row = { brand_slug: string; industry: string; status: string; updated_at: string }

type Suggestion = { id: string; brand_slug: string; industry: string; confidence: number; created_at: string }

// Helper: friendly date like "23 Sep 25 14:05" (24h)
function formatFriendlyDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const dd = String(d.getDate()).padStart(2, '0')
    const mon = months[d.getMonth()] || ''
    const yy = String(d.getFullYear() % 100).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${dd} ${mon} ${yy} ${hh}:${mm}`
  } catch { return '' }
}

export default function IndustryMapping() {
  const [rows, setRows] = useState<Row[]>([])
  const [sugs, setSugs] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [a, b] = await Promise.all([
        fetch('/api/admin/industry?limit=200').then(r => r.json()),
        fetch('/api/admin/industry/suggestions?limit=100').then(r => r.json()),
      ])
      setRows(a.items || [])
      setSugs(b.items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function action(url: string, body: any) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      await load()
    } catch (e: any) {
      alert(e?.message || 'Action failed')
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Industry Mapping</h2>
      <div className="text-sm text-gray-600 mb-3">Deterministic mapping source of truth. Auto‑promoted entries are marked as status <code>auto</code>. You can lock or revert them.</div>
      {loading && <div className="text-sm">Loading…</div>}
      {error && <div className="text-sm text-red-700">{error}</div>}

      <div className="mt-2 overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Brand</th>
              <th className="px-3 py-2 text-left">Industry</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Updated</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.brand_slug} className="border-t">
                <td className="px-3 py-2 font-mono">{r.brand_slug}</td>
                <td className="px-3 py-2">{r.industry}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2 text-gray-500">{new Date(r.updated_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button className="rounded border px-2 py-1 hover:bg-gray-50" onClick={() => action('/api/admin/industry/lock', { brand_slug: r.brand_slug })}>Lock</button>
                    <button className="rounded border px-2 py-1 hover:bg-gray-50" onClick={() => action('/api/admin/industry/revert', { brand_slug: r.brand_slug })}>Revert to Generic</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 text-base font-semibold">Suggestions</h3>
      <div className="text-sm text-gray-600 mb-2">Auto‑generated entries (LLM) awaiting review. Accept moves to mapping, Reject hides.</div>
      <div className="overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Timestamp</th>
              <th className="px-3 py-2 text-left">Brand</th>
              <th className="px-3 py-2 text-left">Industry</th>
              <th className="px-3 py-2 text-left">Confidence</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sugs.map(s => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap" title={new Date(s.created_at).toLocaleString()}>{formatFriendlyDate(s.created_at)}</td>
                <td className="px-3 py-2 font-mono">{s.brand_slug}</td>
                <td className="px-3 py-2">{s.industry}</td>
                <td className="px-3 py-2">
                  {(() => {
                    const c = Math.max(0, Math.min(1, Number(s.confidence ?? 0)))
                    const cls = c >= 0.8
                      ? 'bg-emerald-100 text-emerald-800'
                      : c >= 0.5
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                    return (
                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${cls}`} title="LLM confidence">
                        {c.toFixed(2)}
                      </span>
                    )
                  })()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button className="rounded border px-2 py-1 hover:bg-gray-50" onClick={() => action('/api/admin/industry/accept', { id: s.id })}>Accept</button>
                    <button className="rounded border px-2 py-1 hover:bg-gray-50" onClick={() => action('/api/admin/industry/reject', { id: s.id })}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
