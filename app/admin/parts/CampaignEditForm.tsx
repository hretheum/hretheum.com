'use client'

import { useState, useEffect } from 'react'

function Loader2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

interface Campaign {
  brand_slug: string
  mdx_slug: string
  content: string
  industry: string
  active: boolean
  created_at: string
  updated_at: string
}

export function CampaignEditForm({ brandSlug }: { brandSlug: string }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [content, setContent] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  useEffect(() => {
    fetchCampaign()
  }, [brandSlug])

  async function fetchCampaign() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/campaigns/${brandSlug}`)
      if (!res.ok) throw new Error('Failed to fetch campaign')
      const json = await res.json()
      setCampaign(json.data)
      setContent(json.data.content)
      setActive(json.data.active)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const res = await fetch(`/api/admin/campaigns/${brandSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, active })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to save')
      }

      setSuccess(true)
      setPreviewKey(prev => prev + 1) // Force iframe reload
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!campaign) {
    return <div className="text-red-500">Campaign not found</div>
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{campaign.brand_slug}</h3>
            <p className="text-xs text-gray-500">{campaign.industry}</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Active</span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-600">{error}</span>}
          {success && <span className="text-xs text-green-600">✓ Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {saving && <Loader2Icon className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 grid grid-cols-2 gap-4 pt-4 overflow-hidden">
        {/* MDX Editor */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            MDX Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[calc(100vh-320px)] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            spellCheck={false}
          />
          <div className="text-xs text-gray-500">
            {content.length} characters • {content.split('\n').length} lines
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Live Preview
          </label>
          <iframe
            key={previewKey}
            src={`/brand/${campaign.brand_slug}?preview=true`}
            className="w-full h-[calc(100vh-320px)] border border-gray-300 rounded-lg bg-white"
            title="Campaign Preview"
          />
          <p className="text-xs text-gray-500">
            Preview updates after saving changes
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-500 pt-4 border-t">
        Created: {new Date(campaign.created_at).toLocaleString()} •
        Updated: {new Date(campaign.updated_at).toLocaleString()}
      </div>
    </div>
  )
}
