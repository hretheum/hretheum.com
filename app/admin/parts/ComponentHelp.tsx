'use client'

export const AVAILABLE_COMPONENTS = [
  {
    name: 'PlaybookSection',
    description: 'Strategy/approach section with title, subtitle, and bullet points',
    template: `<PlaybookSection 
  title="Section Title"
  subtitle="Section subtitle"
  bullets={[
    "Bullet point 1",
    "Bullet point 2",
    "Bullet point 3"
  ]}
/>`,
  },
  {
    name: 'CaseGrid',
    description: '2-4 project case studies in grid layout',
    template: `<CaseGrid items={[
  {
    title: "Project Name",
    subtitle: "Role / Impact",
    challenge: "The problem we faced",
    solution: "How we solved it",
    outcome: "Results achieved"
  }
]} />`,
  },
  {
    name: 'MetricsStrip',
    description: '3-4 key metrics/achievements',
    template: `<MetricsStrip items={[
  { label: "Metric Name", value: "15+", source: "From project X" }
]} />`,
  },
  {
    name: 'OutcomeBanner',
    description: 'Full-width statement/outcome banner',
    template: `<OutcomeBanner text="Your compelling outcome statement here" />`,
  },
  {
    name: 'SectionTitle',
    description: 'Large section heading with optional subtitle',
    template: `<SectionTitle title="Section Heading" subtitle="Optional subtitle" />`,
  },
]

export function ComponentHelp({ onInsert }: { onInsert: (template: string) => void }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-700 uppercase">Available Components</h4>
      {AVAILABLE_COMPONENTS.map((comp) => (
        <div key={comp.name} className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h5 className="text-sm font-medium text-gray-900">{comp.name}</h5>
              <p className="text-xs text-gray-500 mt-0.5">{comp.description}</p>
            </div>
            <button
              onClick={() => onInsert(comp.template)}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
            >
              Insert
            </button>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
              Show template
            </summary>
            <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto text-[10px]">
              {comp.template}
            </pre>
          </details>
        </div>
      ))}
    </div>
  )
}
