// Documentation: all comments/docstrings in English per policy.
// Reusable campaign components for MDX rendering.

import React from 'react'

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

export function MetricsStrip({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <section className="my-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items?.map((it, idx) => (
          <div key={idx} className="p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold">{it.value}</div>
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
      <h3 className="text-xl md:text-2xl font-semibold">{title}</h3>
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
      {title && <h3 className="text-xl md:text-2xl font-semibold">{title}</h3>}
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
      <ol className="relative border-s border-neutral-200 dark:border-neutral-700 ml-3">
        {steps.map((s, i) => (
          <li key={i} className="mb-6 ms-6">
            <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 text-xs">{i + 1}</span>
            <h4 className="font-medium">{s}</h4>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function CTAGroup({ ctas }: { ctas: Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }> }) {
  return (
    <div className="my-10 flex flex-wrap gap-3">
      {ctas?.map((cta, i) => (
        <a
          key={i}
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          className={
            'inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border transition hover:opacity-90 ' +
            (cta.variant === 'primary' ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-300')
          }
        >
          {cta.label}
        </a>
      ))}
    </div>
  )
}

export function Quote({ text, author, role }: { text: string; author?: string; role?: string }) {
  return (
    <section className="my-10">
      <blockquote className="border-l-4 pl-4 italic text-neutral-800">“{text}”</blockquote>
      {(author || role) && (
        <div className="mt-2 text-sm text-neutral-600">{author}{author && role ? ' — ' : ''}{role}</div>
      )}
    </section>
  )}
