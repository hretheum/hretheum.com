"use client";
// Theme-aware CoverPage (T36)
// Applies industry theme tokens to the neon slash and CTA styles.
// All comments/docstrings in English per project rules.

import { CampaignThemeProvider } from '@/app/campaign/theme'
import { getIndustryTheme } from '@/lib/theme/industryTheme'
import { CTAGroup, CTABanner } from '@/app/components/ui'

export default function CoverPage() {
  const handleCTAClick = () => {
    // Track CTA click event
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'cta_click',
        event_category: 'engagement',
        event_label: 'cover_page_cta',
        value: 1
      });
    }
  };

  // For the home page we default to the Generic theme; can be extended later to resolve by context.
  const tokens = getIndustryTheme('Generic')

  return (
    <CampaignThemeProvider tokens={tokens}>
      {/* Use overflow-x-hidden to avoid clipping the neon slash horizontally while allowing vertical flow */}
      <section className="min-h-screen flex items-center justify-center relative overflow-x-hidden bg-white"
        style={{ ['--theme-accent' as any]: tokens.accent, ['--campaign-accent' as any]: tokens.accent }}>
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
          {/* Responsive clamp to avoid clipping on very small screens; safer line-height and wrapping */}
          <h1 className="text-[clamp(2.25rem,10vw,3.75rem)] md:text-[8rem] lg:text-[12rem] font-black text-gray-900 leading-[0.95] tracking-tight mb-8 break-words [text-wrap:balance]">
            HIRE TASTE.<br />FIRE MEDIOCRITY.
          </h1>
          <div className="mt-8 md:mt-12 space-y-3 md:space-y-4">
            <p className="text-xl md:text-4xl font-black text-gray-700">
              ERYK ORŁOWSKI
            </p>
            <p className="text-lg md:text-2xl font-bold text-gray-500">
              PRODUCT DESIGN LEADER
            </p>
            <div className="mt-8">
              <CTAGroup align="center" ctas={[{ label: 'Schedule a meeting', href: 'https://calendly.com/eorlowski-theeventa/short-intro', variant: tokens.ctaVariantPrimary === 'filled' ? 'primary' : 'secondary' }]} />
            </div>
          </div>
        </div>
      </section>
      <CTABanner ctas={[{ label: 'Schedule a meeting', href: 'https://calendly.com/eorlowski-theeventa/short-intro', variant: 'primary' }]} />
    </CampaignThemeProvider>
  );
}