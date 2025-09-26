// Documentation: all comments/docstrings in English per policy.
// Reusable campaign components for MDX rendering (Server-compatible).

import React from 'react'
const DEFAULT_CALENDLY = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/hretheum/short-intro'

export function CampaignMeta(props: { role?: string; location?: string; contract?: string; period?: string }) {
  const { role, location, contract, period } = props
  return (
    <section className="my-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm md:text-base">
        {role && (
          <div className="p-4 border rounded-lg"><div className="font-semibold mb-1">Role</div><div>{role}</div></div>
        )}
        {location && (
          <div className="p-4 border rounded-lg"><div className="font-semibold mb-1">Location</div><div>{location}</div></div>
        )}
        {contract && (
          <div className="p-4 border rounded-lg"><div className="font-semibold mb-1">Contract</div><div>{contract}</div></div>
        )}
        {period && (
          <div className="p-4 border rounded-lg"><div className="font-semibold mb-1">Period</div><div>{period}</div></div>
        )}
      </div>
    </section>
  )
}

export function PortfolioShowcase({
  projects,
  tags,
}: {
  projects: Array<{
    title: string
    summary?: string
    role?: string
    challenge?: string
    approach?: string[]
    outcome?: string
    context?: string
  }>
  tags?: string[]
}) {
  return (
    <section className="not-prose py-12">
      <div className="space-y-12">
        {projects.map((project, idx) => (
          <article
            key={`${idx}_${project.title}`}
            className="rounded-[28px] border border-neutral-200 bg-white/95 shadow-[0_28px_60px_-55px_rgba(15,23,42,0.55)] backdrop-blur"
          >
            <div className="px-8 md:px-12 py-9 md:py-11 space-y-7">
              <header className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1 text-[11px] font-semibold tracking-[0.28em] text-neutral-500 uppercase">
                    Case Study
                  </div>
                  {project.role && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-neutral-600 uppercase">
                      <CaseIcon name="users" />
                      <span>{project.role}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-neutral-900">
                  {project.title}
                </h3>
                {project.summary && (
                  <p className="text-base md:text-lg text-neutral-700 leading-relaxed">
                    {project.summary}
                  </p>
                )}
                {project.context && (
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {project.context}
                  </p>
                )}
              </header>

              <div className="grid gap-8 md:grid-cols-[minmax(0,260px)_1fr]">
                <div className="space-y-4">
                  {project.challenge && (
                    <div className="rounded-2xl border border-neutral-800/10 bg-neutral-900 px-5 py-5 text-white">
                      <div className="flex items-center gap-2.5 mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-300">
                        <CaseIcon name="alert" />
                        <span>Challenge</span>
                      </div>
                      <p className="text-sm md:text-base leading-relaxed text-neutral-100/90">{project.challenge}</p>
                    </div>
                  )}
                  {project.outcome && (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-5">
                      <div className="flex items-center gap-2.5 mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-500">
                        <CaseIcon name="trend" />
                        <span>Outcome</span>
                      </div>
                      <p className="text-sm md:text-base font-semibold text-neutral-900 leading-relaxed">
                        {project.outcome}
                      </p>
                    </div>
                  )}
                </div>

                {project.approach && project.approach.length > 0 && (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-6 space-y-5">
                    <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-500">
                      <CaseIcon name="path" />
                      <span>Approach</span>
                    </div>
                    <ul className="space-y-3">
                      {project.approach.map((step, stepIdx) => (
                        <li key={`${idx}_approach_${stepIdx}`} className="flex gap-3">
                          <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'color-mix(in srgb, var(--campaign-accent) 88%, #0f172a 12%)' }}>
                            {stepIdx + 1}
                          </div>
                          <span className="text-sm md:text-base text-neutral-700 leading-relaxed">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {tags && tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {tags.map((tag, tagIdx) => (
            <span
              key={`${tag}_${tagIdx}`}
              className="px-3 py-1 rounded-full text-xs font-semibold tracking-[0.2em] uppercase"
              style={{
                background: 'color-mix(in srgb, var(--campaign-accent) 12%, transparent)',
                color: '#0f172a',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

const CASE_ICONS: Record<string, React.ReactElement> = {
  users: (
    <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  alert: (
    <svg className="h-4 w-4 text-neutral-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  ),
  trend: (
    <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  ),
  path: (
    <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 7h14" />
      <path d="M8 7v10a1 1 0 0 1-1 1H5" />
      <path d="M19 17h-2a1 1 0 0 1-1-1V7" />
      <circle cx="5" cy="7" r="2" />
      <circle cx="19" cy="17" r="2" />
    </svg>
  ),
}

function CaseIcon({ name }: { name: keyof typeof CASE_ICONS }) {
  return CASE_ICONS[name]
}

export function CareerTimeline({
  items,
}: {
  items: Array<{
    company: string
    period: string
    role: string
    tone?: 'accent' | 'dark'
    spotlight?: boolean
  }>
}) {
  return (
    <section className="not-prose py-16">
      <div className="space-y-16">
        {items.map((item, idx) => {
          const headingStyle = item.tone === 'dark' ? { color: '#0f172a' } : { color: 'var(--campaign-accent)' }
          const periodStyle = item.tone === 'dark' ? { color: '#0f172a' } : { color: 'var(--campaign-accent)' }
          const containerClass = item.spotlight
            ? 'relative -mx-4 sm:-mx-8 lg:-mx-12'
            : 'text-center'
          return (
            <div key={`${idx}_${item.company}`} className={containerClass}>
              <div className={item.spotlight ? 'bg-neutral-50 py-16 px-6 sm:px-10 lg:px-16 text-center border border-neutral-200' : ''}>
                <h3
                  className="text-[clamp(2rem,8vw,4rem)] font-black leading-[1.02] tracking-tight break-words [text-wrap:balance] mb-3"
                  style={headingStyle}
                >
                  {item.company}
                </h3>
                <div
                  className="text-[clamp(1.25rem,5vw,2.25rem)] font-black mb-2"
                  style={periodStyle}
                >
                  {item.period}
                </div>
                <div className="text-lg md:text-2xl font-semibold text-neutral-600 uppercase tracking-[0.08em]">
                  {item.role}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function LeadershipSection({
  title,
  items,
  bannerText,
}: {
  title: string
  items: Array<{ heading: string; detail: string }>
  bannerText?: string
}) {
  return (
    <section className="not-prose py-16">
      <div className="text-center mb-10">
        <h2 className="text-[clamp(2.5rem,8vw,6rem)] font-black tracking-tight text-neutral-900 leading-[0.95]">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, idx) => (
          <div key={`${idx}_${item.heading}`} className="bg-neutral-900 text-white px-6 py-8 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.9)]">
            <div className="text-sm font-semibold tracking-[0.3em] uppercase text-neutral-400 mb-3">Details</div>
            <h3 className="text-2xl font-black mb-2 leading-tight">{item.heading}</h3>
            <p className="text-base text-neutral-100 opacity-90">{item.detail}</p>
          </div>
        ))}
      </div>
      {bannerText && (
        <div className="mt-10">
          <div className="text-center text-white font-black uppercase tracking-[0.18em] text-sm sm:text-base py-5 sm:py-6 px-4" style={{ backgroundColor: 'color-mix(in srgb, var(--campaign-accent) 85%, #0f172a 15%)' }}>
            {bannerText}
          </div>
        </div>
      )}
    </section>
  )
}

export function LeadershipPlaybook({
  title,
  columns,
}: {
  title: string
  columns: Array<{ heading: string; bullets: string[] }>
}) {
  return (
    <section className="not-prose py-16">
      <div className="text-center mb-12">
        <h2 className="text-[clamp(2rem,7vw,4.5rem)] font-black tracking-tight text-neutral-900 leading-[0.95]">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {columns.map((column, idx) => (
          <div key={`${idx}_${column.heading}`}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500 mb-4">
              {column.heading}
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              {column.bullets.map((bullet, bulletIdx) => (
                <li key={`${idx}_${bulletIdx}`}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export function CampaignCapabilityGrid({
  title,
  items,
}: {
  title: string
  items: Array<{ icon: 'org' | 'ai' | 'outcome' | string; heading: string; description: string }>
}) {
  return (
    <section className="not-prose py-14">
      <div className="text-center mb-10">
        <h2 className="text-[clamp(2rem,7vw,4rem)] font-black tracking-tight text-neutral-900 leading-[0.95]">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((item, idx) => (
          <div
            key={`${idx}_${item.heading}`}
            className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_60px_-45px_rgba(15,23,42,0.45)]"
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--campaign-accent)' }} />
            <div className="px-8 py-10 space-y-4">
              <CapabilityIcon name={item.icon} />
              <h3 className="text-2xl font-black text-neutral-900 leading-tight">
                {item.heading}
              </h3>
              <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CapabilityIcon({ name }: { name: 'org' | 'ai' | 'outcome' | string }) {
  const iconMap: Record<string, React.ReactElement> = {
    org: (
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
        <svg className="h-6 w-6 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <path d="M17.5 14v3" />
          <path d="M19 17.5h-3" />
          <path d="M6.5 10v4" />
        </svg>
      </div>
    ),
    ai: (
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
        <svg className="h-6 w-6 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M7 15s1.5 2 5 2 5-2 5-2" />
          <path d="M9 11h.01" />
          <path d="M15 11h.01" />
        </svg>
      </div>
    ),
    outcome: (
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
        <svg className="h-6 w-6 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12l4 4 7-7 4 4 3-3" />
        </svg>
      </div>
    ),
  }

  return iconMap[name] ?? iconMap.org
}

export function KeywordsBlock() {
  const keywords = [
    'UX STRATEGY',
    'DESIGN LEADERSHIP',
    'STAKEHOLDER ALIGNMENT',
    'USER RESEARCH',
    'PROTOTYPING',
    'WIREFRAMING',
    'INFORMATION ARCHITECTURE',
    'DESIGN SYSTEMS',
    'B2B SAAS',
    'ACCESSIBILITY',
    'CONVERSION OPTIMIZATION',
    'SERVICE DESIGN',
    'MENTORING',
    'TEAM LEADERSHIP',
  ]
  return (
    <div className="mt-12">
      <div className="px-1 md:px-2 space-y-4">
        <h3 className="text-xs font-semibold tracking-[0.4em] uppercase text-neutral-500">KEYWORDS</h3>
        <div className="flex flex-wrap gap-2">
          {keywords.map((k, i) => (
            <span
              key={i}
              className="rounded-full px-3 py-1 text-xs font-semibold uppercase"
              style={{
                background: 'color-mix(in srgb, var(--campaign-accent) 14%, transparent)',
                color: '#1f1f1f',
                letterSpacing: '0.18em',
              }}
            >
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Richer components for full campaign content
export function ExperienceItem({ company, period, role, bullets }: { company: string; period?: string; role?: string; bullets?: string[] }) {
  return (
    <section className="my-8">
      <div className="flex flex-col md:flex-row md:items-baseline md:gap-4">
        <h3 className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--campaign-accent)' }}>{company}</h3>
        {period && <div className="text-sm text-neutral-500">{period}</div>}
      </div>
      {role && <div className="mt-1 font-medium">{role}</div>}
      {bullets && bullets.length > 0 && (
        <ul className="list-disc pl-6 mt-2 space-y-1 text-neutral-700">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function CaseStudyRich(props: {
  title: string
  context?: string
  role?: string
  challenge?: string
  approach?: string[]
  outcome?: string
}) {
  const { title, context, role, challenge, approach, outcome } = props
  return (
    <section className="my-10">
      <h3 className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--campaign-accent)' }}>{title}</h3>
      {context && <p className="mt-2 text-neutral-700">{context}</p>}
      {role && (
        <p className="mt-2 text-neutral-700">
          <span className="font-medium" style={{ color: 'var(--campaign-accent)' }}>Role:&nbsp;</span>
          {role}
        </p>
      )}
      {challenge && (
        <p className="mt-2 text-neutral-700">
          <span className="font-medium" style={{ color: 'var(--campaign-accent)' }}>Challenge:&nbsp;</span>
          {challenge}
        </p>
      )}
      {approach && approach.length > 0 && (
        <div className="mt-2">
          <div className="font-medium" style={{ color: 'var(--campaign-accent)' }}>Approach</div>
          <ul className="list-disc pl-6 mt-1 space-y-1 text-neutral-700">
            {approach.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
      {outcome && (
        <p className="mt-2 text-neutral-700">
          <span className="font-medium" style={{ color: 'var(--campaign-accent)' }}>Outcome:&nbsp;</span>
          {outcome}
        </p>
      )}
    </section>
  )
}

export function MetricsGrid({ items }: { items: Array<{ label: string; value: string; note?: string }> }) {
  return (
    <section className="my-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items?.map((it, idx) => (
          <div key={idx} className="p-5 rounded-lg border text-center" style={{ borderColor: 'var(--campaign-accent)' }}>
            <div className="text-3xl font-extrabold" style={{ color: 'var(--campaign-accent)' }}>{it.value}</div>
            <div className="text-sm text-neutral-600">{it.label}</div>
            {it.note && <div className="text-xs text-neutral-500 mt-1">{it.note}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

export function PlaybookDiagram({ steps }: { steps: string[] }) {
  return (
    <section className="my-8">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="px-3 py-2 rounded-md border bg-white shadow-sm text-sm font-medium" style={{ borderColor: 'var(--campaign-accent)', color: 'var(--campaign-accent)' }}>{s}</div>
            {i < steps.length - 1 && <div className="" style={{ color: 'var(--campaign-accent)' }}>→</div>}
          </React.Fragment>
        ))}
      </div>
    </section>
  )}

export function GalleryMedia({ items }: { items: Array<{ alt: string; caption?: string }> }) {
  return (
    <section className="my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((m, i) => (
          <figure key={i} className="border rounded-lg p-4 bg-gradient-to-br from-neutral-50 to-neutral-100" style={{ borderColor: 'var(--campaign-accent)' }}>
            <div className="h-40 rounded-md" aria-label={m.alt} style={{ background: `linear-gradient(90deg, var(--campaign-accent) 0%, rgba(0,0,0,0.05) 100%)` }} />
            {m.caption && <figcaption className="mt-2 text-sm" style={{ color: 'var(--campaign-accent)' }}>{m.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  )
}

export function CTABanner({ ctas }: { ctas: Array<{ label: string; href?: string; variant?: 'primary' | 'secondary' }> }) {
  return (
    <div className="fixed bottom-3 left-0 right-0 flex justify-center pointer-events-none" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}>
      {/* Transparent wrapper; the CTA itself carries the visual pill */}
      <div className="pointer-events-auto inline-flex gap-3 rounded-full px-0 py-0">
        {ctas?.map((cta, i) => {
          const id = (cta.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `cta_${i}`
          return (
            <a
              key={i}
              href={cta.href || DEFAULT_CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              data-cta-id={id}
              data-cta-source="cta_banner"
              data-cta-variant={cta.variant || 'secondary'}
              aria-label={cta.label}
              className={'inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border rounded-full transition hover:opacity-90 shadow-lg touch-manipulation'}
              style={cta.variant === 'primary' ? { backgroundColor: 'var(--campaign-accent)', borderColor: 'var(--campaign-accent)', color: '#fff' } : { backgroundColor: '#fff', borderColor: 'var(--campaign-accent)', color: 'var(--campaign-accent)' }}
            >
              {cta.label}
            </a>
          )
        })}
      </div>
    </div>
  )
}

export function MetricsStrip({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <section className="my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {items?.map((it, idx) => (
          <div key={idx} className="p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--campaign-accent)' }}>{it.value}</div>
            <div className="text-sm text-neutral-600">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function CaseStudy({ title, bullets }: { title: string; bullets?: string[] }) {
  return (
    <section className="my-10">
      <h3 className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--campaign-accent)' }}>{title}</h3>
      {bullets && bullets.length > 0 && (
        <ul className="list-disc pl-6 mt-3 space-y-1 text-neutral-700">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function Playbook({ title, bullets }: { title?: string; bullets?: string[] }) {
  return (
    <section className="my-10">
      {title && <h3 className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--campaign-accent)' }}>{title}</h3>}
      {bullets && bullets.length > 0 && (
        <ul className="list-disc pl-6 mt-3 space-y-1 text-neutral-700">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function Timeline({ steps }: { steps: string[] }) {
  return (
    <section className="my-10">
      <ol className="relative border-s ml-3" style={{ borderColor: 'var(--campaign-accent)' }}>
        {steps.map((s, i) => (
          <li key={i} className="mb-6 ms-6">
            <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full text-white text-xs" style={{ backgroundColor: 'var(--campaign-accent)' }}>{i + 1}</span>
            <h4 className="font-medium">{s}</h4>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function CTAGroup({ ctas, align }: { ctas: Array<{ label: string; href?: string; variant?: 'primary' | 'secondary' }>; align?: 'start' | 'center' | 'end' }) {
  const justify = align === 'center' ? 'justify-center' : align === 'end' ? 'justify-end' : 'justify-start'
  return (
    <div className={`my-10 flex flex-wrap gap-3 w-full ${justify}`}>
      {ctas?.map((cta, i) => {
        const id = (cta.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `cta_${i}`
        return (
          <a
            key={i}
            href={cta.href || DEFAULT_CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            data-cta-id={id}
            data-cta-source="cta_group"
            data-cta-variant={cta.variant || 'secondary'}
            className={'inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border transition hover:opacity-90'}
            style={cta.variant === 'primary' ? { backgroundColor: 'var(--campaign-accent)', borderColor: 'var(--campaign-accent)', color: '#fff' } : { backgroundColor: '#fff', borderColor: 'var(--campaign-accent)', color: 'var(--campaign-accent)' }}
          >
            {cta.label}
          </a>
        )
      })}
    </div>
  )
}

export function Quote({ text, author, role }: { text: string; author?: string; role?: string }) {
  return (
    <section className="my-10">
      <blockquote className="border-l-4 pl-4 italic text-neutral-800" style={{ borderLeftColor: 'var(--campaign-accent)' }}>“{text}”</blockquote>
      {(author || role) && (
        <div className="mt-2 text-sm text-neutral-600">{author}{author && role ? ' — ' : ''}{role}</div>
      )}
    </section>
  )
}

// Closing banner similar to homepage ClosingPage; kept server-safe (no hooks)
export function ClosingBanner() {
  return (
    <section className="not-prose relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-[60vh] md:min-h-screen flex items-center justify-center overflow-x-hidden bg-black text-white mt-16 mb-0">
      {/* Neon Slash */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[200%] h-2 bg-gradient-to-r from-transparent via-purple-500 to-transparent transform -rotate-12 opacity-90"></div>
      </div>
      {/* Main Content */}
      <div className="text-center z-10 px-4 sm:px-6 max-w-6xl">
        <h2 className="text-[clamp(2.25rem,9vw,3.25rem)] md:text-[6rem] lg:text-[8rem] font-black leading-[1.02] tracking-tight mb-10 break-words [text-wrap:balance]">
          HIRE ME<br/>
          OR STAY<br/>
          IRRELEVANT.
        </h2>

        <div className="mb-8">
          <a
            href={DEFAULT_CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            data-cta-id="closing_banner_cta"
            data-cta-source="closing_banner"
            data-cta-variant="primary"
            className="inline-block px-6 md:px-8 py-3 md:py-4 text-lg md:text-xl font-black border transition-colors duration-200"
            style={{ backgroundColor: 'var(--campaign-accent)', borderColor: 'var(--campaign-accent)', color: '#000' }}
          >
            Schedule a meeting
          </a>
        </div>

        <div className="inline-block text-left md:text-center p-6 md:p-8" style={{ backgroundColor: 'var(--campaign-accent)', color: '#000' }}>
          <div className="text-xl md:text-2xl font-black mb-3 md:mb-4">CONTACT</div>
          <div className="text-lg md:text-xl">
            <a
              href="mailto:eof@offline.pl"
              data-cta-id="contact_email"
              data-cta-source="contact"
              data-cta-variant="secondary"
              className="underline decoration-transparent hover:decoration-current transition"
              style={{ color: '#000' }}
            >
              eof@offline.pl
            </a>
          </div>
          <div className="text-lg md:text-xl">
            <a
              href="tel:+48535555066"
              data-cta-id="contact_phone"
              data-cta-source="contact"
              data-cta-variant="secondary"
              className="underline decoration-transparent hover:decoration-current transition"
              style={{ color: '#000' }}
            >
              +48 535 555 066
            </a>
          </div>
          <a
            href="https://linkedin.com/in/eofek"
            target="_blank"
            rel="noopener noreferrer"
            data-cta-id="contact_linkedin"
            data-cta-source="contact"
            data-cta-variant="secondary"
            className="text-base md:text-lg underline"
            style={{ color: '#000' }}
          >
            linkedin.com/in/eofek
          </a>
        </div>
      </div>
    </section>
  )
}

// --- Brand-adapted components inspired by root domain ---

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="not-prose py-10 text-center">
      <h2 className="font-black text-gray-900 leading-[0.95] tracking-tight mb-2"
          style={{ fontSize: 'clamp(2rem, 8vw, 6rem)' }}>
        {title}
      </h2>
      {subtitle && (
        <div className="text-sm font-medium" style={{ color: 'var(--campaign-accent)' }}>{subtitle}</div>
      )}
    </div>
  )
}

export function CaseGrid({ items, colsClass }: { items: Array<{ title: string; subtitle?: string; challenge?: string; solution?: string; outcome?: string; details?: string }>; colsClass?: string }) {
  // Auto layout: for exactly 4 items use 2x2 on md and 4x1 on xl; otherwise default 1/2/3
  const autoCols = items.length === 4 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  const gridCols = colsClass || autoCols
  return (
    <section className="not-prose py-8">
      <div className={`grid ${gridCols} gap-8`}>
        {items.map((it, index) => (
          <div key={index} className="bg-black text-white p-8 md:p-10 min-h-[240px]">
            <h3 className="text-2xl md:text-3xl font-black mb-2 leading-tight [text-wrap:balance]">{it.title}</h3>
            {it.subtitle && <h4 className="text-sm md:text-base font-bold mb-5" style={{ color: 'var(--campaign-accent)' }}>{it.subtitle}</h4>}
            <div className="space-y-4 text-sm md:text-base">
              {it.challenge && (
                <div>
                  <div className="text-[11px] font-bold text-gray-400">CHALLENGE</div>
                  <div>{it.challenge}</div>
                </div>
              )}
              {it.solution && (
                <div>
                  <div className="text-[11px] font-bold text-gray-400">SOLUTION</div>
                  <div>{it.solution}</div>
                </div>
              )}
              {it.outcome && (
                <div>
                  <div className="text-[11px] font-bold text-gray-400">OUTCOME</div>
                  <div className="font-bold" style={{ color: 'var(--campaign-accent)' }}>{it.outcome}</div>
                </div>
              )}
              {it.details && (
                <div>
                  <div className="text-[11px] font-bold text-gray-400">DETAILS</div>
                  <p className="leading-relaxed opacity-95">{it.details}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function OutcomeBanner({ text }: { text: string }) {
  return (
    <div className="not-prose mt-10 -mx-4 sm:mx-0 text-white p-8 text-center" style={{ backgroundColor: 'var(--campaign-accent)' }}>
      <div className="text-2xl md:text-3xl font-black">
        {text}
      </div>
    </div>
  )
}
