"use client";
import React from 'react'
import type { Industry } from '@/lib/industry'
import { getAllowedIndustries } from '@/lib/industry'
import type { IndustrySource } from '@/lib/industry_server'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-2 text-neutral-700">{children}</div>
    </div>
  )
}

export function IndustryHero({ industry, slug, source }: { industry: Industry; slug: string; source?: IndustrySource }) {
  // When adding a new industry in data/brand_industries.json → allowed[],
  // remember to add a deterministic template below, and update DB CHECK constraints via migration.
  const allowed = new Set(getAllowedIndustries())
  const safeIndustry = allowed.has(industry) ? industry : ('Generic' as Industry)
  // Deterministic, template-based copy per industry (no trademarks)
  const copy: Record<Industry, { headline: string; sub: string; bullets: string[]; cta: string }> = {
    SaaS: {
      headline: `Faster hiring signals for SaaS teams`,
      sub: `Template-based overview tailored to software product organizations — neutral copy for {${slug}}.`,
      bullets: [
        'Highlight product usage narratives and trial-to-paid signals',
        'Emphasize iterative delivery and multi-tenant security posture',
        'Align recruiting insights with release cadence',
      ],
      cta: 'See SaaS playbook',
    },
    Pharma: {
      headline: `Compliance-aware hiring insights for Pharma`,
      sub: `Neutral, regulated-friendly content — contextualized for {${slug}} without trademarks.`,
      bullets: [
        'Surface qualification aligned with GxP scenarios',
        'Stress privacy and auditability of data flows',
        'Speed up stakeholder reviews with templated briefs',
      ],
      cta: 'See Pharma playbook',
    },
    FinTech: {
      headline: `Signal-driven recruiting for FinTech`,
      sub: `Template copy for financial services and payments — brand-safe for {${slug}}.`,
      bullets: [
        'Feature risk & compliance-aware qualification',
        'Latency and reliability insights by role',
        'Tie recruiting to growth and risk posture',
      ],
      cta: 'See FinTech playbook',
    },
    Commerce: {
      headline: `Conversion-focused hiring for Commerce`,
      sub: `Industry template for retail & e-commerce — safe, brand-neutral for {${slug}}.`,
      bullets: [
        'Prioritize customer journey and fulfillment skill sets',
        'Operational resilience and seasonality readiness',
        'Connect staffing with merchandising cycles',
      ],
      cta: 'See Commerce playbook',
    },
    Manufacturing: {
      headline: `Operational excellence in Manufacturing roles`,
      sub: `Neutral template tuned for manufacturing contexts — adapted for {${slug}}.`,
      bullets: [
        'Safety and quality systems awareness',
        'Plant readiness and shift operations',
        'Digital transformation & OT integration',
      ],
      cta: 'See Manufacturing playbook',
    },
    Public: {
      headline: `Public sector hiring signals`,
      sub: `Template-based content suitable for agencies and public bodies — {${slug}}.`,
      bullets: [
        'Procurement and transparency constraints',
        'Security & residency requirements',
        'Citizen-facing service reliability',
      ],
      cta: 'See Public playbook',
    },
    eLearning: {
      headline: `Education & eLearning hiring signals`,
      sub: `Neutral, template-based content for education technology and online learning — contextualized for {${slug}}.`,
      bullets: [
        'Emphasize learner outcomes and course completion signals',
        'Content operations, assessment integrity, and scalability',
        'Privacy, accessibility (WCAG), and academic integrity policies',
      ],
      cta: 'See eLearning playbook',
    },
    Generic: {
      headline: `Adaptive hiring signals for your context`,
      sub: `Neutral, template-based overview — brand-safe for {${slug}}.`,
      bullets: [
        'Above-the-fold SSR to avoid flicker',
        'Consent-gated telemetry and privacy-first defaults',
        'SEO-safe canonical routing for subdomains',
      ],
      cta: 'See how it works',
    },
  }

  const c = copy[safeIndustry] || copy['Generic']

  return (
    <section className="mb-8">
      <h1 className="text-3xl font-semibold">{c.headline}</h1>
      <div className="mt-2 text-xs text-neutral-600 flex items-center gap-3">
        <div><strong>Industry template:</strong> {safeIndustry}</div>
        <div><strong>Source:</strong> {source || 'n/a'}</div>
      </div>
      <p className="mt-3 text-neutral-600">{c.sub}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {c.bullets.map((b, i) => (
          <Section key={i} title={['Value', 'Focus', 'Outcome'][i] || `Point ${i + 1}`}>
            {b}
          </Section>
        ))}
      </div>
      <div className="mt-6">
        <a className="inline-flex items-center rounded bg-black px-4 py-2 text-white hover:bg-neutral-800" href="#">
          {c.cta}
        </a>
      </div>
    </section>
  )
}
