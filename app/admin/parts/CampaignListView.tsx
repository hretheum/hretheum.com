'use client'

import { useState, useEffect, useCallback } from 'react'

interface Campaign {
  brand_slug: string
  mdx_slug: string
  slug: string
  industry: string
  visible: boolean
  role?: string
  location?: string
  created_at: string
  updated_at: string
}

interface Filters {
  industry: string
  status: string
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function CampaignListView({ onPreview }: { onPreview: (slug: string) => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    industry: '',
    status: '',
    search: '',
    sortBy: 'updated_at',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })
  // Debounced search
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.industry) params.set('industry', filters.industry)
      if (filters.status) params.set('status', filters.status)
      if (filters.search) params.set('search', filters.search)
      params.set('sortBy', filters.sortBy)
      params.set('sortOrder', filters.sortOrder)
      params.set('page', pagination.page.toString())
      params.set('pageSize', pagination.pageSize.toString())

      const res = await fetch(`/api/admin/campaigns/list?${params}`)
      if (res.ok) {
        const json = await res.json()
        setCampaigns(json.data || [])
        setPagination(json.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.pageSize])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleSearchChange = (value: string) => {
    if (searchDebounce) clearTimeout(searchDebounce)
    const timeout = setTimeout(() => {
      setFilters({ ...filters, search: value })
      setPagination({ ...pagination, page: 1 })
    }, 300)
    setSearchDebounce(timeout)
  }

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      setFilters({ ...filters, sortBy: column, sortOrder: 'asc' })
    }
  }

  const toggleVisibility = async (slug: string, currentVisible: boolean) => {
    try {
      setTogglingSlug(slug)
      const res = await fetch(`/api/admin/campaigns/${slug}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !currentVisible })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to toggle visibility')
      }

      // Optimistic update
      setCampaigns(campaigns.map(c => 
        c.slug === slug ? { ...c, visible: !currentVisible } : c
      ))

    } catch (err: any) {
      console.error('Failed to toggle visibility:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setTogglingSlug(null)
    }
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (filters.sortBy !== column) return null
    return (
      <span className="ml-1">
        {filters.sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Brand
          </label>
          <input
            type="text"
            placeholder="Search by brand slug..."
            defaultValue={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* Industry Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry
          </label>
          <select
            value={filters.industry}
            onChange={(e) => {
              setFilters({ ...filters, industry: e.target.value })
              setPagination({ ...pagination, page: 1 })
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Industries</option>
            <option value="SaaS">SaaS</option>
            <option value="FinTech">FinTech</option>
            <option value="Telecom">Telecom</option>
            <option value="DigitalTech">DigitalTech</option>
            <option value="Retail">Retail</option>
            <option value="iGaming">iGaming</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value })
              setPagination({ ...pagination, page: 1 })
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(filters.industry || filters.status || filters.search) && (
          <button
            onClick={() => {
              setFilters({
                industry: '',
                status: '',
                search: '',
                sortBy: 'updated_at',
                sortOrder: 'desc'
              })
              setPagination({ ...pagination, page: 1 })
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>


      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('brand_slug')}
              >
                Brand <SortIcon column="brand_slug" />
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('industry')}
              >
                Industry <SortIcon column="industry" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Campaign
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                Created <SortIcon column="created_at" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Visibility
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No campaigns found
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.brand_slug} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {campaign.brand_slug}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {campaign.industry || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {campaign.mdx_slug}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleVisibility(campaign.slug, campaign.visible)}
                      disabled={togglingSlug === campaign.slug}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        campaign.visible
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } ${togglingSlug === campaign.slug ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {togglingSlug === campaign.slug ? (
                        <>⏳ Toggling...</>
                      ) : (
                        <>{campaign.visible ? '👁️ Visible' : '🚫 Hidden'}</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => onPreview(campaign.brand_slug)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        👁️ Preview
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} campaigns
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
