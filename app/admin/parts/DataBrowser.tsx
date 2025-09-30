'use client'

import { useState, useEffect } from 'react'

interface CaseStudy {
  title: string
  subtitle: string
  challenge: string
  solution: string
  outcome: string
}

export function DataBrowser({ onInsert }: { onInsert: (template: string) => void }) {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCaseStudies()
  }, [])

  async function fetchCaseStudies() {
    try {
      // Fetch from RAG chunks (Supabase)
      const res = await fetch('/api/admin/case-studies')
      if (!res.ok) throw new Error('Failed to fetch')
      
      const { data } = await res.json()
      setCaseStudies((data || []).slice(0, 6))
    } catch (err) {
      console.error('Failed to fetch case studies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInsertCaseStudy = (study: CaseStudy) => {
    const template = `<CaseStudy 
  title="${study.title}"
  subtitle="${study.subtitle}"
  challenge="${study.challenge}"
  solution="${study.solution}"
  outcome="${study.outcome}"
/>`
    onInsert(template)
  }

  if (loading) {
    return (
      <div className="text-xs text-gray-500 text-center py-4">
        Loading case studies...
      </div>
    )
  }

  if (caseStudies.length === 0) {
    return (
      <div className="text-xs text-gray-500 text-center py-4">
        No case studies found in recent campaigns
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-700 uppercase">Recent Case Studies</h4>
      {caseStudies.map((study, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h5 className="text-sm font-medium text-gray-900">{study.title}</h5>
              <p className="text-xs text-gray-500 mt-0.5">{study.subtitle}</p>
            </div>
            <button
              onClick={() => handleInsertCaseStudy(study)}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex-shrink-0"
            >
              Insert
            </button>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
              Preview
            </summary>
            <div className="mt-2 p-2 bg-gray-50 rounded space-y-1 text-[10px]">
              <p><strong>Challenge:</strong> {study.challenge.slice(0, 60)}...</p>
              <p><strong>Solution:</strong> {study.solution.slice(0, 60)}...</p>
              <p><strong>Outcome:</strong> {study.outcome.slice(0, 60)}...</p>
            </div>
          </details>
        </div>
      ))}
    </div>
  )
}
