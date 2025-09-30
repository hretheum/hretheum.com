'use client'

import React, { useState } from 'react'

type InputMethod = 'url' | 'text' | 'file'

interface FormData {
  inputMethod: InputMethod
  url: string
  text: string
  file: File | null
  brandSlug: string
  industry: string
  accent: string
  role?: string
  location?: string
}

const INITIAL_FORM_DATA: FormData = {
  inputMethod: 'url',
  url: '',
  text: '',
  file: null,
  brandSlug: '',
  industry: '',
  accent: '#6366f1',
  role: '',
  location: '',
}

export default function CampaignCreationForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  const handleInputMethodChange = (method: InputMethod) => {
    setFormData({ ...formData, inputMethod: method })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage('')
    setIsSubmitting(true)

    // Client-side validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.brandSlug.trim()) {
      newErrors.brandSlug = 'Brand slug is required'
    }
    
    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required'
    }
    
    if (formData.inputMethod === 'url' && !formData.url.trim()) {
      newErrors.url = 'URL is required'
    }
    
    if (formData.inputMethod === 'text' && !formData.text.trim()) {
      newErrors.text = 'Job posting text is required'
    }
    
    if (formData.inputMethod === 'file' && !formData.file) {
      newErrors.file = 'File is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      // Prepare API request body
      let source: any
      
      if (formData.inputMethod === 'url') {
        source = {
          type: 'url',
          url: formData.url
        }
      } else if (formData.inputMethod === 'text') {
        source = {
          type: 'text',
          content: formData.text
        }
      } else if (formData.inputMethod === 'file' && formData.file) {
        // Convert file to base64
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result?.toString().split(',')[1] || ''
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(formData.file!)
        })
        
        const fileExt = formData.file.name.split('.').pop()?.toLowerCase() || 'txt'
        const fileType = ['md', 'txt', 'pdf', 'docx'].includes(fileExt) ? fileExt : 'txt'
        
        source = {
          type: 'file',
          fileData,
          fileName: formData.file.name,
          fileType
        }
      }
      
      const requestBody = {
        source,
        brandSlug: formData.brandSlug,
        industry: formData.industry,
        metadata: {
          accent: formData.accent,
          role: formData.role || undefined,
          location: formData.location || undefined,
        }
      }
      
      // Call API
      const response = await fetch('/api/admin/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        // Extract detailed error message
        let errorMessage = result.error || `API error: ${response.status}`
        if (result.message) {
          errorMessage = `${errorMessage}: ${result.message}`
        }
        if (result.errors && Array.isArray(result.errors)) {
          errorMessage = `${errorMessage}\n${result.errors.join('\n')}`
        }
        throw new Error(errorMessage)
      }
      
      setSuccessMessage(
        `Campaign created successfully! Slug: ${result.campaignSlug || result.brandSlug}`
      )
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData(INITIAL_FORM_DATA)
        setSuccessMessage('')
      }, 2000)
      
    } catch (error: any) {
      console.error('Campaign creation error:', error)
      setErrors({ submit: error.message || 'Failed to create campaign' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors({ file: 'File size must be less than 5MB' })
      return
    }
    setFormData({ ...formData, file })
    setErrors({ ...errors, file: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Input Method Tabs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Input Method
        </label>
        <div className="flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => handleInputMethodChange('url')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              formData.inputMethod === 'url'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📎 URL
          </button>
          <button
            type="button"
            onClick={() => handleInputMethodChange('text')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              formData.inputMethod === 'text'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Text
          </button>
          <button
            type="button"
            onClick={() => handleInputMethodChange('file')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              formData.inputMethod === 'file'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 File
          </button>
        </div>
      </div>

      {/* Input Content */}
      <div className="space-y-4">
        {formData.inputMethod === 'url' && (
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Job Posting URL
            </label>
            <input
              type="url"
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/careers/job-id"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.url ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">{errors.url}</p>
            )}
            <p className="mt-1 text-xs text-green-600">
              ✅ LinkedIn URLs are now supported (headless browser mode)
            </p>
          </div>
        )}

        {formData.inputMethod === 'text' && (
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
              Job Posting Content
            </label>
            <textarea
              id="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Paste job posting content here..."
              rows={8}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.text ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.text && (
              <p className="mt-1 text-sm text-red-600">{errors.text}</p>
            )}
          </div>
        )}

        {formData.inputMethod === 'file' && (
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.html"
              className={`w-full text-sm ${errors.file ? 'text-red-600' : 'text-gray-500'}`}
            />
            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: PDF, DOC, DOCX, TXT, HTML (max 5MB)
            </p>
          </div>
        )}
      </div>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="brandSlug" className="block text-sm font-medium text-gray-700 mb-1">
            Brand Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="brandSlug"
            value={formData.brandSlug}
            onChange={(e) => setFormData({ ...formData, brandSlug: e.target.value })}
            placeholder="tmobile"
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.brandSlug ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.brandSlug && (
            <p className="mt-1 text-sm text-red-600">{errors.brandSlug}</p>
          )}
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            id="industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.industry ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select industry...</option>
            <option value="SaaS">SaaS</option>
            <option value="Pharma">Pharma</option>
            <option value="FinTech">FinTech</option>
            <option value="Commerce">Commerce</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Public">Public</option>
            <option value="eLearning">eLearning</option>
            <option value="Telecom">Telecom</option>
            <option value="Retail">Retail</option>
            <option value="DigitalTech">DigitalTech</option>
            <option value="iGaming">iGaming</option>
            <option value="Generic">Generic</option>
          </select>
          {errors.industry && (
            <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
          )}
        </div>

        <div>
          <label htmlFor="accent" className="block text-sm font-medium text-gray-700 mb-1">
            Accent Color
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              id="accent"
              value={formData.accent}
              onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={formData.accent}
              onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
              placeholder="#6366f1"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role (optional)
          </label>
          <input
            type="text"
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="Senior Designer"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location (optional)
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Warsaw, Poland"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 whitespace-pre-wrap">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setFormData(INITIAL_FORM_DATA)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isSubmitting ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>
    </form>
  )
}
