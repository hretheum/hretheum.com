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

export function IndustryHero({ industry, slug, source, confidence }: { industry: Industry; slug: string; source?: IndustrySource; confidence?: number }) {
  // When adding a new industry in data/brand_industries.json → allowed[],
  // remember to add a deterministic template below, and update DB CHECK constraints via migration.
  const allowed = new Set(getAllowedIndustries())
  const safeIndustry = allowed.has(industry) ? industry : ('Generic' as Industry)
  // Deterministic, template-based copy per industry (no trademarks)
  const copy: Record<Industry, { headline: string; sub: React.ReactNode; bullets: string[]; cta: string }> = {
    SaaS: {
      headline: `Faster hiring signals for SaaS teams`,
      sub: <>Template-based overview tailored to software product organizations — neutral copy for <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Highlight product usage narratives and trial-to-paid signals',
        'Emphasize iterative delivery and multi-tenant security posture',
        'Align recruiting insights with release cadence',
      ],
      cta: 'See SaaS playbook',
    },
    Pharma: {
      headline: `Compliance-aware hiring insights for Pharma`,
      sub: <>Neutral, regulated-friendly content — contextualized for <strong className="font-semibold">{slug}</strong> without trademarks.</>,
      bullets: [
        'Surface qualification aligned with GxP scenarios',
        'Stress privacy and auditability of data flows',
        'Speed up stakeholder reviews with templated briefs',
      ],
      cta: 'See Pharma playbook',
    },
    FinTech: {
      headline: `Signal-driven recruiting for FinTech`,
      sub: <>Template copy for financial services and payments — brand-safe for <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Feature risk & compliance-aware qualification',
        'Latency and reliability insights by role',
        'Tie recruiting to growth and risk posture',
      ],
      cta: 'See FinTech playbook',
    },
    Commerce: {
      headline: `Conversion-focused hiring for Commerce`,
      sub: <>Industry template for retail & e-commerce — safe, brand-neutral for <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Prioritize customer journey and fulfillment skill sets',
        'Operational resilience and seasonality readiness',
        'Connect staffing with merchandising cycles',
      ],
      cta: 'See Commerce playbook',
    },
    Manufacturing: {
      headline: `Operational excellence in Manufacturing roles`,
      sub: <>Neutral template tuned for manufacturing contexts — adapted for <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Safety and quality systems awareness',
        'Plant readiness and shift operations',
        'Digital transformation & OT integration',
      ],
      cta: 'See Manufacturing playbook',
    },
    Public: {
      headline: `Public sector hiring signals`,
      sub: <>Template-based content suitable for agencies and public bodies — <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Procurement and transparency constraints',
        'Security & residency requirements',
        'Citizen-facing service reliability',
      ],
      cta: 'See Public playbook',
    },
    eLearning: {
      headline: `Education & eLearning hiring signals`,
      sub: <>Neutral, template-based content for education technology and online learning — contextualized for <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Emphasize learner outcomes and course completion signals',
        'Content operations, assessment integrity, and scalability',
        'Privacy, accessibility (WCAG), and academic integrity policies',
      ],
      cta: 'See eLearning playbook',
    },
    Generic: {
      headline: `Adaptive hiring signals for your context`,
      sub: <>Neutral, template-based overview — brand-safe for <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Above-the-fold SSR to avoid flicker',
        'Consent-gated telemetry and privacy-first defaults',
        'SEO-safe canonical routing for subdomains',
      ],
      cta: 'See how it works',
    },
  };

  const c = copy[safeIndustry] || copy['Generic']

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden bg-white mb-8">
      {/* Tiny caption pinned near the top edge */}
      <div className="pointer-events-none absolute top-2 left-0 right-0 flex justify-center">
        <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-[10px] text-neutral-600 shadow-sm border border-neutral-200">
          <span className="font-medium">Industry: {safeIndustry}</span>
          <span>Source: {source || 'n/a'}</span>
          {typeof confidence === 'number' && (
            <span className="inline-flex items-center gap-1">
              <span>Conf:</span>
              <span
                className={
                  'inline-flex items-center gap-1 rounded px-1 py-0.5 ' +
                  (confidence >= 0.8
                    ? 'bg-emerald-100 text-emerald-800'
                    : confidence >= 0.5
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800')
                }
                title="LLM confidence"
              >
                {confidence.toFixed(2)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Neon Slash background like CoverPage (match root) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[200%] h-2 bg-gradient-to-r from-transparent via-purple-500 to-transparent transform rotate-12 opacity-90"></div>
      </div>

      {/* Main content */}
      <div className="text-center z-10 px-4 sm:px-6">
        <h1 className="max-w-4xl mx-auto text-[clamp(2.125rem,8.5vw,3.25rem)] md:text-[5rem] lg:text-[7.5rem] font-black text-gray-900 leading-[0.96] tracking-tight mb-6 break-words [text-wrap:balance]">
          {c.headline}
        </h1>
        <p className="mt-3 text-neutral-700 text-base sm:text-lg max-w-2xl mx-auto">{c.sub}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {c.bullets.map((b, i) => (
            <Section key={i} title={['Value', 'Focus', 'Outcome'][i] || `Point ${i + 1}`}>
              {b}
            </Section>
          ))}
        </div>
      </div>
    </section>
  )
}
