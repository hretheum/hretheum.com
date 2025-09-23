"use client";
// Theme-aware CoverPage (T36)
// Applies industry theme tokens to the neon slash and CTA styles.
// All comments/docstrings in English per project rules.

import { CampaignThemeProvider } from '@/app/campaign/theme'
import { getIndustryTheme } from '@/lib/theme/industryTheme'
import { CTAGroup, CTABanner, SectionTitle, OutcomeBanner } from '@/app/components/ui'
import { League_Spartan, Inter } from 'next/font/google'

// Display fonts for hero heading; chosen via theme tokens
const spartanHero = League_Spartan({ subsets: ['latin'], weight: ['900'], display: 'swap' })
const interHero = Inter({ subsets: ['latin'], weight: ['900'], display: 'swap' })

export default function CoverPage() {

  // For the home page we default to the Generic theme; can be extended later to resolve by context.
  const tokens = getIndustryTheme('Generic')
  // Compute hero typography classes from tokens to keep root/brand in sync.
  const heroFontClass = tokens.heroFont === 'spartan' ? spartanHero.className : interHero.className
  const heroLeadingCls = tokens.heroLeadingTight ? 'leading-[0.9]' : 'leading-[1]'
  const heroTrackingCls = tokens.heroTightTracking
    ? 'tracking-[-0.01em] md:tracking-[-0.02em] lg:tracking-[-0.035em]'
    : 'tracking-tight'
  const heroSizeCls = tokens.heroLargeScale
    ? 'text-[clamp(2.5rem,10vw,4rem)] md:text-[9rem] lg:text-[13rem]'
    : 'text-[clamp(2.25rem,10vw,3.75rem)] md:text-[8rem] lg:text-[12rem]'

  return (
    <CampaignThemeProvider tokens={tokens}>
      <div style={{ ['--theme-accent' as any]: tokens.accent, ['--campaign-accent' as any]: tokens.accent }}>
        {/* Use overflow-x-hidden to avoid clipping the neon slash horizontally while allowing vertical flow */}
        <section className="min-h-screen flex items-center justify-center relative overflow-x-hidden bg-white">
        {/* Neon Slash */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-[200%] h-2 opacity-90"
            style={{
              background: `linear-gradient(90deg, ${tokens.gradientFrom} 0%, ${tokens.gradientVia} 50%, ${tokens.gradientTo} 100%)`,
              transform: `translateY(${tokens.slashOffsetYRem}rem) rotate(${tokens.slashAngleDeg}deg)`
            }}
          ></div>
        </div>

        {/* Main Content */}
        <div className="text-center z-10 px-4 sm:px-6">
          {/* Unified with brand hero: theme-driven display font, tracking, and sizes */}
          <h1 className={`${heroFontClass} ${heroSizeCls} font-black text-gray-900 ${heroLeadingCls} ${heroTrackingCls} mb-8 break-words [text-wrap:balance]`}>
            HIRE TASTE.<br />FIRE MEDIOCRITY.
          </h1>
          <div className="mt-8 md:mt-12 space-y-3 md:space-y-4">
            <p className="text-xl md:text-4xl font-black text-gray-700">
              ERYK ORŁOWSKI
            </p>
            <p className="text-lg md:text-2xl font-bold text-gray-500">
              PRODUCT DESIGN LEADER
            </p>
            <div className="mt-8 hidden md:block">
              <CTAGroup align="center" ctas={[{ label: 'Schedule a meeting', variant: tokens.ctaVariantPrimary === 'filled' ? 'primary' : 'secondary' }]} />
            </div>
          </div>
        </div>
        </section>

        {/* Section Title under hero (UI-only for T37/3) */}
        <div className="px-4 sm:px-6 max-w-5xl mx-auto">
          <SectionTitle title="Selected Work" subtitle="Case studies and outcomes" />
        </div>
        {/* Outcome banner under hero (T37/4) */}
        <div className="px-4 sm:px-6 max-w-5xl mx-auto">
          <OutcomeBanner text="Design leadership that turns metrics into outcomes" />
        </div>
        <div className="md:hidden">
          <CTABanner ctas={[{ label: 'Schedule a meeting', variant: 'primary' }]} />
        </div>
      </div>
    </CampaignThemeProvider>
  );
}