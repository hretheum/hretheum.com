// Documentation: all comments/docstrings in English per policy.
// Reusable campaign components for MDX rendering.

import React from 'react'
import { useCampaignTheme } from '@/app/campaign/theme'
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

// Richer components for full campaign content
export function ExperienceItem({ company, period, role, bullets }: { company: string; period?: string; role?: string; bullets?: string[] }) {
  const { accent } = useCampaignTheme()
  return (
    <section className="my-8">
      <div className="flex flex-col md:flex-row md:items-baseline md:gap-4">
        <h3 className="text-xl md:text-2xl font-semibold" style={{ color: accent }}>{company}</h3>
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
  const { accent } = useCampaignTheme()
  return (
    <section className="my-10">
      <h3 className="text-xl md:text-2xl font-semibold" style={{ color: accent }}>{title}</h3>
      {context && <p className="mt-2 text-neutral-700">{context}</p>}
      {role && (
        <p className="mt-2 text-neutral-700">
          <span className="font-medium" style={{ color: accent }}>Role:&nbsp;</span>
          {role}
        </p>
      )}
      {challenge && (
        <p className="mt-2 text-neutral-700">
          <span className="font-medium" style={{ color: accent }}>Challenge:&nbsp;</span>
          {challenge}
        </p>
      )}
      {approach && approach.length > 0 && (
        <div className="mt-2">
          <div className="font-medium" style={{ color: accent }}>Approach</div>
          <ul className="list-disc pl-6 mt-1 space-y-1 text-neutral-700">
            {approach.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
      {outcome && (
        <p className="mt-2 text-neutral-700">
          <span className="font-medium" style={{ color: accent }}>Outcome:&nbsp;</span>
          {outcome}
        </p>
      )}
    </section>
  )
}

export function MetricsGrid({ items }: { items: Array<{ label: string; value: string; note?: string }> }) {
  const { accent } = useCampaignTheme()
  return (
    <section className="my-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items?.map((it, idx) => (
          <div key={idx} className="p-5 rounded-lg border text-center" style={{ borderColor: accent }}>
            <div className="text-3xl font-extrabold" style={{ color: accent }}>{it.value}</div>
            <div className="text-sm text-neutral-600">{it.label}</div>
            {it.note && <div className="text-xs text-neutral-500 mt-1">{it.note}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

export function PlaybookDiagram({ steps }: { steps: string[] }) {
  const { accent } = useCampaignTheme()
  return (
    <section className="my-8">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="px-3 py-2 rounded-md border bg-white shadow-sm text-sm font-medium" style={{ borderColor: accent, color: accent }}>{s}</div>
            {i < steps.length - 1 && <div className="" style={{ color: accent }}>→</div>}
          </React.Fragment>
        ))}
      </div>
    </section>
  )}

export function GalleryMedia({ items }: { items: Array<{ alt: string; caption?: string }> }) {
  const { accent } = useCampaignTheme()
  return (
    <section className="my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((m, i) => (
          <figure key={i} className="border rounded-lg p-4 bg-gradient-to-br from-neutral-50 to-neutral-100" style={{ borderColor: accent }}>
            <div className="h-40 rounded-md" aria-label={m.alt} style={{ background: `linear-gradient(90deg, ${accent} 0%, rgba(0,0,0,0.05) 100%)` }} />
            {m.caption && <figcaption className="mt-2 text-sm" style={{ color: accent }}>{m.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  )
}

export function CTABanner({ ctas }: { ctas: Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }> }) {
  const { accent } = useCampaignTheme()
  return (
    <div className="fixed bottom-3 left-0 right-0 flex justify-center pointer-events-none">
      <div className="pointer-events-auto inline-flex gap-3 rounded-full border bg-white/95 backdrop-blur px-4 py-2 shadow">
        {ctas?.map((cta, i) => (
          <a
            key={i}
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className={'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-full transition hover:opacity-90 '}
            style={cta.variant === 'primary' ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : { backgroundColor: '#fff', borderColor: accent, color: accent }}
          >
            {cta.label}
          </a>
        ))}
      </div>
    </div>
  )
}

export function MetricsStrip({ items }: { items: Array<{ label: string; value: string }> }) {
  const { accent } = useCampaignTheme()
  return (
    <section className="my-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items?.map((it, idx) => (
          <div key={idx} className="p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold" style={{ color: accent }}>{it.value}</div>
            <div className="text-sm text-neutral-600">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function CaseStudy({ title, bullets }: { title: string; bullets?: string[] }) {
  const { accent } = useCampaignTheme()
  return (
    <section className="my-10">
      <h3 className="text-xl md:text-2xl font-semibold" style={{ color: accent }}>{title}</h3>
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
  const { accent } = useCampaignTheme()
  return (
    <section className="my-10">
      {title && <h3 className="text-xl md:text-2xl font-semibold" style={{ color: accent }}>{title}</h3>}
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
  const { accent } = useCampaignTheme()
  return (
    <section className="my-10">
      <ol className="relative border-s ml-3" style={{ borderColor: accent }}>
        {steps.map((s, i) => (
          <li key={i} className="mb-6 ms-6">
            <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full text-white text-xs" style={{ backgroundColor: accent }}>{i + 1}</span>
            <h4 className="font-medium">{s}</h4>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function CTAGroup({ ctas }: { ctas: Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }> }) {
  const { accent } = useCampaignTheme()
  return (
    <div className="my-10 flex flex-wrap gap-3">
      {ctas?.map((cta, i) => (
        <a
          key={i}
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          className={'inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border transition hover:opacity-90'}
          style={cta.variant === 'primary' ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : { backgroundColor: '#fff', borderColor: accent, color: accent }}
        >
          {cta.label}
        </a>
      ))}
    </div>
  )
}

export function Quote({ text, author, role }: { text: string; author?: string; role?: string }) {
  const { accent } = useCampaignTheme()
  return (
    <section className="my-10">
      <blockquote className="border-l-4 pl-4 italic text-neutral-800" style={{ borderLeftColor: accent, color: accent }}>“{text}”</blockquote>
      {(author || role) && (
        <div className="mt-2 text-sm text-neutral-600" style={{ color: accent }}>{author}{author && role ? ' — ' : ''}{role}</div>
      )}
    </section>
  )
}

// --- Brand-adapted components inspired by root domain ---

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { accent } = useCampaignTheme()
  return (
    <div className="not-prose py-10 text-center">
      <h2 className="font-black text-gray-900 leading-[0.95] tracking-tight mb-2"
          style={{ fontSize: 'clamp(2rem, 8vw, 6rem)' }}>
        {title}
      </h2>
      {subtitle && (
        <div className="text-sm font-medium" style={{ color: accent }}>{subtitle}</div>
      )}
    </div>
  )
}

export function CaseGrid({ items }: { items: Array<{ title: string; subtitle?: string; challenge?: string; solution?: string; outcome?: string; details?: string }> }) {
  const { accent } = useCampaignTheme()
  return (
    <section className="not-prose py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((it, index) => (
          <div key={index} className="bg-black text-white p-6 cursor-pointer group relative overflow-hidden">
            {/* Main content */}
            <div className="group-hover:opacity-0 transition-opacity duration-300">
              <h3 className="text-2xl font-black mb-1">{it.title}</h3>
              {it.subtitle && <h4 className="text-sm font-bold mb-4" style={{ color: accent }}>{it.subtitle}</h4>}
              <div className="space-y-3 text-sm">
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
                    <div className="font-bold" style={{ color: accent }}>{it.outcome}</div>
                  </div>
                )}
              </div>
            </div>
            {/* Hover details overlay */}
            {(it.details || it.outcome) && (
              <div className="absolute inset-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center" style={{ backgroundColor: accent }}>
                <div>
                  <h3 className="text-xl font-black mb-3">{it.title}</h3>
                  <p className="text-sm leading-relaxed">{it.details || it.outcome}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export function OutcomeBanner({ text }: { text: string }) {
  const { accent } = useCampaignTheme()
  return (
    <div className="not-prose mt-10 -mx-4 sm:mx-0 text-white p-8 text-center" style={{ backgroundColor: accent }}>
      <div className="text-2xl md:text-3xl font-black">
        {text}
      </div>
    </div>
  )
}
