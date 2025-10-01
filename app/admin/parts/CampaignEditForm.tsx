'use client'

import { useState, useEffect, useRef } from 'react'
import { ComponentHelp } from './ComponentHelp'
import { DataBrowser } from './DataBrowser'

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
  const [showHelp, setShowHelp] = useState(false)
  const [helpTab, setHelpTab] = useState<'components' | 'data'>('components')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const handleInsertComponent = (template: string) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + '\n\n' + template + '\n\n' + content.substring(end)
    
    setContent(newContent)
    
    // Focus back and position cursor after inserted template
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + template.length + 4
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const handleRegenerateBody = () => {
    if (!confirm('Regenerate body from frontmatter sections? This will replace current body.')) return
    
    try {
      // Parse frontmatter
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (!match) {
        setError('Invalid MDX format')
        return
      }
      
      const [, frontmatterStr, ] = match
      
      // Better YAML parser for nested structures
      const frontmatter: any = {}
      const lines = frontmatterStr.split('\n')
      let currentKey = ''
      let currentArray: any[] = []
      let currentObject: any = null
      let currentNestedArray: any[] = []
      let indent = 0
      let inNestedArray = false
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()
        const lineIndent = line.search(/\S/)
        
        if (!trimmed) continue
        
        // Top-level key
        if (lineIndent === 0 && line.includes(':') && !trimmed.startsWith('-')) {
          const [key, ...valueParts] = line.split(':')
          const value = valueParts.join(':').trim()
          currentKey = key.trim()
          
          if (value === '' || value === '[]') {
            currentArray = []
            frontmatter[currentKey] = currentArray
            indent = 0
          } else {
            frontmatter[currentKey] = value.replace(/^['"]|['"]$/g, '')
          }
          inNestedArray = false
          currentObject = null
        }
        // Array item start
        else if (trimmed.startsWith('- ') && lineIndent === 2) {
          const value = trimmed.substring(2).trim()
          if (value.includes(':')) {
            // New object in array
            const [k, v] = value.split(':').map(s => s.trim())
            currentObject = { [k]: v }
            currentArray.push(currentObject)
            inNestedArray = false
          } else {
            currentArray.push(value)
          }
        }
        // Nested property
        else if (lineIndent === 4 && currentObject && line.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':')
          const value = valueParts.join(':').trim()
          const propKey = key.trim()
          
          if (value === '' || value === '[]') {
            currentNestedArray = []
            currentObject[propKey] = currentNestedArray
            inNestedArray = true
          } else {
            currentObject[propKey] = value.replace(/^['"]|['"]$/g, '')
            inNestedArray = false
          }
        }
        // Nested array item
        else if (trimmed.startsWith('- ') && lineIndent === 6 && inNestedArray) {
          const value = trimmed.substring(2).trim()
          currentNestedArray.push(value)
        }
      }
      
      // Generate new body
      let newBody = '\n<SectionTitle title="' + (frontmatter.brand || campaign?.brand_slug).toUpperCase() + '" subtitle="Leadership • Outcomes • Operating model" />\n\n'
      newBody += '<OutcomeBanner text="From metrics to outcomes — measurably, scalably, consistently" />\n\n'
      
      // Add PlaybookSections from frontmatter
      if (frontmatter.sections) {
        const playbookSections = frontmatter.sections.filter((s: any) => s.type === 'playbook')
        if (playbookSections.length > 0) {
          newBody += '{/* Playbook Sections */}\n'
          playbookSections.forEach((section: any) => {
            newBody += `\n<PlaybookSection\n`
            newBody += `  title="${section.title}"\n`
            if (section.subtitle) newBody += `  subtitle="${section.subtitle}"\n`
            newBody += `  bullets={${JSON.stringify(section.bullets)}}\n`
            newBody += `/>\n`
          })
        }
      }
      
      newBody += '\n<SectionTitle title="Next Steps" subtitle="Let\'s discuss how I can add value to your team" />\n'
      
      setContent(`---\n${frontmatterStr}\n---${newBody}`)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err: any) {
      setError('Failed to parse: ' + err.message)
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
            onClick={handleRegenerateBody}
            className="px-3 py-2 text-xs bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 border border-amber-200"
          >
            🔄 Regenerate Body
          </button>
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
      <div className="flex-1 grid grid-cols-12 gap-4 pt-4 overflow-hidden">
        {/* MDX Editor */}
        <div className="col-span-5 space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">Raw MDX</label>
              <span className="text-xs text-gray-500">(frontmatter + body)</span>
            </div>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {showHelp ? 'Hide' : 'Show'} Components
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="absolute inset-0 w-full h-full p-4 font-mono text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              spellCheck={false}
              placeholder="---
slug: brand-name
brand: Brand Name
industry: SaaS
accent: '#8b5cf6'
sections:
  - type: playbook
    title: Your Title
    subtitle: Subtitle
    bullets:
      - Bullet 1
      - Bullet 2
---

<PlaybookSection ... />"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{content?.length || 0} characters • {content?.split('\n').length || 0} lines</span>
            <span className="text-amber-600">⚠️ Full MDX editing - be careful with frontmatter syntax</span>
          </div>
        </div>

        {/* Component Help (collapsible) */}
        {showHelp && (
          <div className="col-span-2 overflow-y-auto border-l pl-4">
            <div className="flex gap-2 mb-4 border-b">
              <button
                onClick={() => setHelpTab('components')}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                  helpTab === 'components'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Components
              </button>
              <button
                onClick={() => setHelpTab('data')}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                  helpTab === 'data'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Case Studies
              </button>
            </div>
            {helpTab === 'components' ? (
              <ComponentHelp onInsert={handleInsertComponent} />
            ) : (
              <DataBrowser onInsert={handleInsertComponent} />
            )}
          </div>
        )}

        {/* Live Preview */}
        <div className={`${showHelp ? 'col-span-5' : 'col-span-7'} space-y-2 flex flex-col`}>
          <label className="block text-sm font-medium text-gray-700">Live Preview</label>
          <iframe
            key={previewKey}
            src={`/brand/${campaign.brand_slug}?preview=true`}
            className="flex-1 w-full border border-gray-300 rounded-lg bg-white"
            title="Campaign Preview"
          />
          <p className="text-xs text-gray-500">Preview updates after saving changes</p>
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
