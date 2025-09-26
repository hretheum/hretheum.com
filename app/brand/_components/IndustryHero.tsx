import React from 'react'
import type { Industry } from '@/lib/industry'
import { getAllowedIndustries } from '@/lib/industry'
import type { IndustrySource } from '@/lib/industry_server'
import { getIndustryTheme, withOverrides } from '@/lib/theme/industryTheme'
import { League_Spartan, Inter } from 'next/font/google'
const DEFAULT_CALENDLY = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/hretheum/short-intro'

// Display fonts for hero heading; selected via theme tokens at runtime.
const spartanHero = League_Spartan({ subsets: ['latin'], weight: ['900'], display: 'swap' })
const interHero = Inter({ subsets: ['latin'], weight: ['900'], display: 'swap' })

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-2 text-neutral-700">{children}</div>
    </div>
  )
}

export function IndustryHero({ industry, slug, source, confidence, accent, ctaLabel, showCtaOnMobile = true, heroHeadline }: { industry: Industry; slug: string; source?: IndustrySource; confidence?: number; accent?: string; ctaLabel?: string; showCtaOnMobile?: boolean; heroHeadline?: string }) {
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
    Retail: {
      headline: `Retail & shopper apps hiring signals`,
      sub: <>Template tuned for high-scale shopper apps and FMCG retail — brand-neutral for <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Focus on journeys: browse → list → coupon → store → purchase',
        'Data-informed UX: cohorts, retention, session depth, ARPMAU',
        'Seasonality & campaigns: readiness and drive-to-store signals',
      ],
      cta: 'See Retail playbook',
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
    Telecom: {
      headline: `Network & Telecom hiring signals`,
      sub: <>Neutral, template-based content for telecommunications operators and carriers — contextualized for <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Network reliability, 5G rollout, and edge infrastructure',
        'ARPU, churn, and customer lifecycle operations',
        'Regulatory compliance, spectrum, and privacy policies',
      ],
      cta: 'See Telecom playbook',
    },
    DigitalTech: {
      headline: `Digital technology leadership & UX signals`,
      sub: <>Neutral, template-based content for digital consultancies and software houses — adapted for <strong className="font-semibold">{slug}</strong> (focus on fintech, insurance, retail, and public).</>,
      bullets: [
        'Design systems and experience platforms across multiple verticals',
        'Discovery → delivery for financial/banking tech and complex enterprise',
        'AI- and data-informed design operations; measurable business impact',
      ],
      cta: 'See DigitalTech playbook',
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
    iGaming: {
      headline: `Experience design and ops signals for iGaming`,
      sub: <>Template tuned for regulated gaming and betting organizations — brand-neutral for <strong className="font-semibold">{slug}</strong>.</>,
      bullets: [
        'Player lifecycle: acquisition → retention → reactivation across jurisdictions',
        'Safety, compliance, and RG telemetry woven into product rituals',
        'Cross-team orchestration: product, trading, CS, compliance, and HR',
      ],
      cta: 'See iGaming playbook',
    },
    Dummy: {
      headline: `I see what you did there`,
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
  const headlineText = heroHeadline || c.headline

  // Industry theme tokens with optional campaign override (accent)
  const baseTheme = getIndustryTheme(safeIndustry)
  const theme = withOverrides(baseTheme, accent ? { accent } : undefined)
  const heroFontClass = theme.heroFont === 'spartan' ? spartanHero.className : interHero.className
  const heroLeadingCls = theme.heroLeadingTight ? 'leading-[0.9]' : 'leading-[1]'
  const heroTrackingCls = theme.heroTightTracking
    ? 'tracking-[-0.01em] md:tracking-[-0.02em] lg:tracking-[-0.035em]'
    : 'tracking-tight'
  const heroSizeCls = theme.heroLargeScale
    ? 'text-[clamp(2.5rem,10vw,4rem)] md:text-[9rem] lg:text-[13rem]'
    : 'text-[clamp(2.25rem,10vw,3.75rem)] md:text-[8rem] lg:text-[12rem]'

  const ctaVisibilityCls = showCtaOnMobile ? '' : 'hidden md:block'

  const headlineCaseCls = theme.headlineCase === 'uppercase' ? 'uppercase' : ''

  // Feature flag: show debug caption by default in non-production, require explicit enable on production
  const IS_PROD = (process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV) === 'production'
  const showCaption = String(process.env.NEXT_PUBLIC_INDUSTRY_DEBUG_BADGE ?? (IS_PROD ? 'false' : 'true')).toLowerCase() === 'true'

  // Legacy CTA telemetry handler removed; unified CtaTelemetry handles clicks.

  return (
    <section className="relative min-h-[100svh] md:min-h-screen flex items-center justify-center overflow-x-hidden bg-white mb-8">
      {/* Tiny caption pinned near the top edge (feature-flagged) */}
      {showCaption && (
        <div className="pointer-events-none absolute top-3 left-0 right-0 flex justify-center">
          <div
            className={
              'pointer-events-auto inline-flex items-center gap-3 rounded-full backdrop-blur px-3 py-1 text-[10px] shadow-sm border ' +
              (theme.captionStyle === 'badge'
                ? 'bg-white/80'
                : 'bg-white/50')
            }
            style={theme.captionStyle === 'badge' ? { borderColor: theme.accent, color: theme.accent } : {}}
          >
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
      )}

      {/* Neon Slash background like CoverPage (match root) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-[200%] h-2 opacity-90"
          style={{
            background: `linear-gradient(90deg, ${theme.gradientFrom} 0%, ${theme.gradientVia} 50%, ${theme.gradientTo} 100%)`,
            transform: `translateY(${theme.slashOffsetYRem}rem) rotate(${theme.slashAngleDeg}deg)`,
          }}
        ></div>
      </div>

      {/* Main content */}
      <div className="text-center z-10 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className={`${heroFontClass} mx-auto text-gray-900 ${headlineCaseCls} ${heroLeadingCls} ${heroTrackingCls} break-words [text-wrap:balance] font-black ${heroSizeCls}`}>
            {headlineText}
          </h1>
        </div>
        <div className="mt-8 md:mt-12 space-y-3 md:space-y-4">
          <p className="text-xl md:text-4xl font-black text-gray-700">ERYK ORŁOWSKI</p>
          <p className="text-lg md:text-2xl font-bold text-gray-500">PRODUCT DESIGN LEADER</p>
          <div className={`mt-8 ${ctaVisibilityCls}`}>
            <a
              href={DEFAULT_CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              data-cta-id="brand_hero_cta"
              data-cta-source="brand_hero"
              data-cta-variant={theme.ctaVariantPrimary === 'filled' ? 'primary' : 'secondary'}
              className={
                'inline-block px-5 py-3 text-sm md:text-base font-medium transition-all duration-200 border ' +
                (theme.ctaVariantPrimary === 'filled'
                  ? 'text-white'
                  : 'text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-700')
              }
              style={theme.ctaVariantPrimary === 'filled' ? { backgroundColor: theme.accent, borderColor: theme.accent } : {}}
            >
              {ctaLabel || 'Schedule a meeting'}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
