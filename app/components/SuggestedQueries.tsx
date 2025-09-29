// All comments/documentation in English per project rules.
import React from 'react'

export default function SuggestedQueries({
  suggestions,
  onPick,
  onLearnMore,
  learnMoreLabel = 'How these hints work',
}: {
  suggestions: string[]
  onPick: (q: string, index: number) => void
  onLearnMore?: () => void
  learnMoreLabel?: string
}) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null
  return (
    <div className="mb-2 flex flex-wrap gap-2" aria-label="Suggested queries">
      {suggestions.map((s, i) => (
        <button
          key={`${i}-${s.slice(0, 16)}`}
          type="button"
          className="inline-flex items-center rounded-full border border-gray-300 bg-white/80 px-3 py-1 text-[12px] text-gray-700 shadow-sm hover:bg-white w-[70%] break-words text-left"
          onClick={() => onPick(s, i)}
        >
          {s}
        </button>
      ))}
      {onLearnMore && (
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50/80 px-3 py-1 text-[12px] text-indigo-700 shadow-sm hover:bg-indigo-50"
          onClick={() => onLearnMore?.()}
          aria-label={learnMoreLabel}
          title={learnMoreLabel}
        >
          {/* subtle icon-like dot */}
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
          {learnMoreLabel}
        </button>
      )}
    </div>
  )
}
