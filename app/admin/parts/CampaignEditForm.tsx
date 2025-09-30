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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Campaign</h2>
          <p className="text-sm text-gray-500 mt-1">
            {campaign.brand_slug} • {campaign.industry}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Active</span>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2Icon className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✓ Saved successfully!
        </div>
      )}

      {/* Editor */}
      <div className="grid grid-cols-2 gap-6">
        {/* MDX Editor */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            MDX Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[600px] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            spellCheck={false}
          />
          <div className="text-xs text-gray-500">
            {content.length} characters • {content.split('\n').length} lines
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Preview
          </label>
          <div className="h-[600px] p-4 border border-gray-300 rounded-lg overflow-auto bg-gray-50">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {content}
            </pre>
          </div>
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
