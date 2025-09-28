// All comments/documentation in English per project rules.
import React from 'react'

export default function SuggestedQueries({
  suggestions,
  onPick,
}: {
  suggestions: string[]
  onPick: (q: string, index: number) => void
}) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null
  return (
    <div className="mb-2 flex flex-wrap gap-2" aria-label="Suggested queries">
      {suggestions.map((s, i) => (
        <button
          key={`${i}-${s.slice(0, 16)}`}
          type="button"
          className="inline-flex items-center rounded-full border border-gray-300 bg-white/80 px-3 py-1 text-[12px] text-gray-700 shadow-sm hover:bg-white"
          onClick={() => onPick(s, i)}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
