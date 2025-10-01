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
    name: 'CaseStudy',
    description: 'Single detailed case study',
    template: `<CaseStudy 
  title="Project Title"
  subtitle="Role & Impact"
  challenge="Problem statement"
  solution="How you solved it"
  outcome="Results achieved"
/>`,
  },
  {
    name: 'CaseStudyRich',
    description: 'Rich case study with media and detailed sections',
    template: `<CaseStudyRich 
  title="Project Title"
  client="Client Name"
  role="Your Role"
  duration="Timeline"
  description="Project description"
/>`,
  },
  {
    name: 'MetricsStrip',
    description: '3-4 key metrics/achievements in horizontal strip',
    template: `<MetricsStrip items={[
  { label: "Metric Name", value: "15+", source: "From project X" }
]} />`,
  },
  {
    name: 'MetricsGrid',
    description: 'Grid of metrics with descriptions',
    template: `<MetricsGrid items={[
  { label: "Metric", value: "100+", description: "Details" }
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
  {
    name: 'Timeline',
    description: 'Career/project timeline with events',
    template: `<Timeline items={[
  { year: "2023", title: "Role", description: "What you did" }
]} />`,
  },
  {
    name: 'CareerTimeline',
    description: 'Detailed career progression timeline',
    template: `<CareerTimeline />`,
  },
  {
    name: 'Quote',
    description: 'Blockquote with attribution',
    template: `<Quote 
  text="The quote text here"
  author="Author Name"
  role="Their Role"
/>`,
  },
  {
    name: 'CTABanner',
    description: 'Call-to-action banner',
    template: `<CTABanner 
  title="CTA Heading"
  subtitle="Supporting text"
  buttonText="Action"
  buttonLink="#"
/>`,
  },
  {
    name: 'AIOriginalsSection',
    description: 'Showcase of AI-generated original work/content',
    template: `<AIOriginalsSection />`,
  },
  {
    name: 'Playbook',
    description: 'Multi-section playbook component',
    template: `<Playbook />`,
  },
  {
    name: 'LeadershipSection',
    description: 'Leadership philosophy/approach section',
    template: `<LeadershipSection />`,
  },
  {
    name: 'PortfolioShowcase',
    description: 'Gallery-style portfolio showcase with projects',
    template: `<PortfolioShowcase />`,
  },
  {
    name: 'GalleryMedia',
    description: 'Media gallery with images/videos',
    template: `<GalleryMedia items={[
  { type: "image", src: "/path/to/image.jpg", alt: "Description" }
]} />`,
  },
]

export function ComponentHelp({ onInsert }: { onInsert: (template: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs space-y-2">
        <h4 className="font-semibold text-blue-900">📖 Campaign Structure</h4>
        <div className="text-blue-700 space-y-1">
          <p><strong>Frontmatter</strong> → Hero, theme, accent, CTAs</p>
          <p><strong>Body</strong> → Components below (between hero & footer)</p>
          <p><strong>Auto-footer</strong> → Leadership, Playbook, AI, Projects</p>
        </div>
        <details className="mt-2">
          <summary className="cursor-pointer text-blue-800 font-medium">View full page flow</summary>
          <div className="mt-2 p-2 bg-white rounded text-[10px] space-y-1 font-mono">
            <div className="text-gray-500">{'// 1. Hero (from frontmatter)'}</div>
            <div className="text-gray-500">{'// 2. Your body components ↓'}</div>
            <div className="pl-3 text-blue-600">&lt;PlaybookSection /&gt;</div>
            <div className="pl-3 text-blue-600">&lt;CaseGrid /&gt;</div>
            <div className="pl-3 text-blue-600">etc...</div>
            <div className="text-gray-500">{'// 3. Auto-footer sections'}</div>
          </div>
        </details>
      </div>
      
      <h4 className="text-xs font-semibold text-gray-700 uppercase">Available Body Components</h4>
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
