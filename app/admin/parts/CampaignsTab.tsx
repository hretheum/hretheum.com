'use client'

import React, { useState } from 'react'

/**
 * Campaigns Tab - Admin UI for campaign creation
 * Task 2.1: Initial placeholder implementation
 * 
 * TODO Task 2.2: Add campaign creation form with 3 input methods
 * TODO Task 2.3: Add real-time processing status display
 */
export default function CampaignsTab() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold">Campaign Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Create and manage employer-focused landing pages
        </p>
      </div>

      {/* Placeholder content - Task 2.2 will add the actual form */}
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
              disabled
              className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              New Campaign (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <dt className="text-sm font-medium text-gray-500">Total Campaigns</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">—</dd>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <dt className="text-sm font-medium text-gray-500">Active</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">—</dd>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <dt className="text-sm font-medium text-gray-500">Industries</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">—</dd>
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
