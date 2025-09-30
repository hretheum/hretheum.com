'use client'

import React, { useState, useEffect } from 'react'
import CampaignCreationForm from './CampaignCreationForm'
import { CampaignEditForm } from './CampaignEditForm'

/**
 * Campaigns Tab - Admin UI for campaign creation & editing
 * Task 2.1: ✅ Tab structure
 * Task 2.2: ✅ Campaign creation form (basic implementation)
 * Task 2.3: ✅ Campaign editing UI
 */
export default function CampaignsTab() {
  const [showForm, setShowForm] = useState(false)
  const [editSlug, setEditSlug] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check URL for edit param
    const params = new URLSearchParams(window.location.search)
    const edit = params.get('edit')
    if (edit) setEditSlug(edit)
    
    fetchCampaigns()
  }, [])

  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/admin/campaigns/list')
      if (res.ok) {
        const json = await res.json()
        setCampaigns(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(slug: string) {
    setEditSlug(slug)
    setShowForm(false)
    const params = new URLSearchParams(window.location.search)
    params.set('edit', slug)
    window.history.replaceState({}, '', `?${params.toString()}`)
  }

  function handleCloseEdit() {
    setEditSlug(null)
    const params = new URLSearchParams(window.location.search)
    params.delete('edit')
    window.history.replaceState({}, '', params.toString() ? `?${params.toString()}` : window.location.pathname)
    fetchCampaigns() // Refresh list
  }

  // Show edit form if editSlug is set
  if (editSlug) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-lg font-semibold">Edit Campaign</h2>
          <button
            type="button"
            onClick={handleCloseEdit}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to campaigns
          </button>
        </div>
        <CampaignEditForm brandSlug={editSlug} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold">Campaign Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Create and manage employer-focused landing pages
        </p>
      </div>

      {/* Toggle Form View */}
      {!showForm ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg
              className="h-full w-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Campaign Creation</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create new campaigns from job postings via URL, text paste, or file upload.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              New Campaign
            </button>
          </div>
        </div>
      </div>
      ) : (
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Create New Campaign</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to overview
            </button>
          </div>
          <CampaignCreationForm />
        </div>
      )}

      {/* Campaigns List */}
      {!loading && campaigns.length > 0 && (
        <div className="rounded-lg border bg-white">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-900">Existing Campaigns</h3>
          </div>
          <div className="divide-y">
            {campaigns.map((campaign: any) => (
              <div key={campaign.brand_slug} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-900">{campaign.brand_slug}</div>
                  <div className="text-xs text-gray-500">
                    {campaign.industry} • {campaign.active ? '✓ Active' : 'Inactive'}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(campaign.brand_slug)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Edit →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <dt className="text-sm font-medium text-gray-500">Total Campaigns</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{campaigns.length || '—'}</dd>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <dt className="text-sm font-medium text-gray-500">Active</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {campaigns.filter(c => c.active).length || '—'}
          </dd>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <dt className="text-sm font-medium text-gray-500">Industries</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {new Set(campaigns.map(c => c.industry)).size || '—'}
          </dd>
        </div>
      </div>

      {/* Coming soon features */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Task 2.2 - Campaign Creation Form</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>3 input methods: URL scraping, text paste, file upload</li>
                <li>LLM-powered industry classification with confidence scores</li>
                <li>AI-generated campaign content using RAG</li>
                <li>Real-time processing status display</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
