'use client'

import { useEffect, useState } from 'react'

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ProcessingStep {
  id: string
  label: string
  status: StepStatus
  error?: string
}

export interface ProcessingStatusData {
  steps: ProcessingStep[]
  progress: number // 0-100
  isComplete: boolean
  error?: string
}

interface ProcessingStatusProps {
  jobId: string
  onComplete?: (success: boolean) => void
  onCancel?: () => void
}

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 'validate', label: 'Validating input', status: 'pending' },
  { id: 'fetch', label: 'Fetching job posting', status: 'pending' },
  { id: 'industry', label: 'Analyzing industry', status: 'pending' },
  { id: 'rag', label: 'Retrieving context', status: 'pending' },
  { id: 'generate', label: 'Generating content with AI', status: 'pending' },
  { id: 'save', label: 'Saving to database', status: 'pending' },
  { id: 'index', label: 'Updating indexes', status: 'pending' },
  { id: 'complete', label: 'Complete', status: 'pending' },
]

export function ProcessingStatus({ jobId, onComplete, onCancel }: ProcessingStatusProps) {
  const [status, setStatus] = useState<ProcessingStatusData>({
    steps: INITIAL_STEPS,
    progress: 0,
    isComplete: false,
  })
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPolling, setIsPolling] = useState(true)

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Polling for status updates
  useEffect(() => {
    if (!isPolling) return

    let pollCount = 0
    const maxPolls = 120 // 60s timeout (500ms * 120)

    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/campaigns/status/${jobId}`)
        if (!res.ok) {
          // If 404, job might not exist yet - keep polling
          if (res.status === 404 && pollCount < maxPolls) {
            return
          }
          throw new Error('Failed to fetch status')
        }

        const data: ProcessingStatusData = await res.json()
        setStatus(data)

        if (data.isComplete) {
          setIsPolling(false)
          onComplete?.(data.error ? false : true)
        }
      } catch (error: any) {
        console.error('[ProcessingStatus] Poll error:', error)
        if (pollCount >= maxPolls) {
          setIsPolling(false)
          setStatus((prev) => ({
            ...prev,
            isComplete: true,
            error: 'Processing timeout - please check status manually',
          }))
          onComplete?.(false)
        }
      }
    }

    // Initial immediate poll
    poll()

    // Then poll every 500ms
    const interval = setInterval(() => {
      pollCount++
      if (pollCount >= maxPolls) {
        clearInterval(interval)
        setIsPolling(false)
        return
      }
      poll()
    }, 500)

    return () => clearInterval(interval)
  }, [jobId, isPolling, onComplete])

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'running':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Processing Campaign</h3>
          <p className="text-sm text-gray-500">Elapsed time: {formatTime(elapsedTime)}</p>
        </div>
        {!status.isComplete && onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Progress</span>
          <span className="text-gray-500">{Math.round(status.progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {status.steps.map((step, idx) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.status === 'running' ? 'bg-blue-50' : ''
            } ${step.status === 'failed' ? 'bg-red-50' : ''}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getStatusIcon(step.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-gray-900' : 'text-gray-700'
                  }`}
                >
                  {idx + 1}. {step.label}
                </span>
                {step.status === 'running' && (
                  <span className="text-xs text-blue-600 font-medium">Running...</span>
                )}
              </div>
              {step.error && (
                <p className="mt-1 text-xs text-red-600">{step.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {status.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-semibold text-red-900 mb-1">Processing Failed</h4>
          <p className="text-sm text-red-700">{status.error}</p>
        </div>
      )}

      {/* Success Banner */}
      {status.isComplete && !status.error && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-semibold text-green-900 mb-1">✓ Campaign Created Successfully!</h4>
          <p className="text-sm text-green-700">Processing completed in {formatTime(elapsedTime)}</p>
        </div>
      )}
    </div>
  )
}
