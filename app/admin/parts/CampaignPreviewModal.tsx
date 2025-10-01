'use client'

/**
 * Campaign Preview Modal
 * Phase 2.A: Preview-only modal (no editing)
 * Extracted from CampaignEditForm.tsx
 */

import { useState, useEffect } from 'react'

interface Campaign {
  brand_slug: string
  slug: string
  industry: string
  visible: boolean
  created_at: string
  updated_at: string
}

interface CampaignPreviewModalProps {
  brandSlug: string
  onClose: () => void
}

function Loader2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export function CampaignPreviewModal({ brandSlug, onClose }: CampaignPreviewModalProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleRefresh() {
    setPreviewKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <Loader2Icon className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error || 'Campaign not found'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white w-full h-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Preview: {campaign.brand_slug}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">{campaign.industry}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                campaign.visible 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {campaign.visible ? 'Visible' : 'Hidden'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
              title="Refresh preview"
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Preview iframe */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Live Preview
              </label>
              <a 
                href={`/brand/${campaign.brand_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Open in new tab →
              </a>
            </div>
            <iframe
              key={previewKey}
              src={`/brand/${campaign.brand_slug}?preview=true`}
              className="flex-1 w-full border border-gray-300 rounded-lg bg-white"
              title="Campaign Preview"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Created: {new Date(campaign.created_at).toLocaleString()}
            </span>
            <span>
              Updated: {new Date(campaign.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
