// Documentation: All comments and docstrings are in English per project policy.
// Industry theme tokens and helpers.

import type { Industry } from '@/lib/industry'

export type HeadlineCase = 'uppercase' | 'sentence'

export type IndustryThemeTokens = {
  accent: string
  headlineCase: HeadlineCase
  slashAngleDeg: number
  slashOffsetYRem: number
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  ctaVariantPrimary: 'outline' | 'filled'
  captionStyle: 'subtle' | 'badge'
}

const THEMES: Record<Industry | 'Generic', IndustryThemeTokens> = {
  SaaS: {
    accent: '#6366f1', // indigo-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
    gradientFrom: 'rgba(0,0,0,0)',
    gradientVia: '#6366f1',
    gradientTo: 'rgba(0,0,0,0)',
    ctaVariantPrimary: 'outline',
    captionStyle: 'subtle',
  },
  Pharma: {
    accent: '#0ea5e9', // sky-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
    gradientFrom: 'rgba(0,0,0,0)',
    gradientVia: '#0ea5e9',
    gradientTo: 'rgba(0,0,0,0)',
    ctaVariantPrimary: 'outline',
    captionStyle: 'subtle',
  },
  FinTech: {
    accent: '#22c55e', // emerald-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
    gradientFrom: 'rgba(0,0,0,0)',
    gradientVia: '#22c55e',
    gradientTo: 'rgba(0,0,0,0)',
    ctaVariantPrimary: 'outline',
    captionStyle: 'subtle',
  },
  Commerce: {
    accent: '#f59e0b', // amber-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
    gradientFrom: 'rgba(0,0,0,0)',
    gradientVia: '#f59e0b',
    gradientTo: 'rgba(0,0,0,0)',
    ctaVariantPrimary: 'outline',
    captionStyle: 'subtle',
  },
  Manufacturing: {
    accent: '#64748b', // slate-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
    gradientFrom: 'rgba(0,0,0,0)',
    gradientVia: '#64748b',
    gradientTo: 'rgba(0,0,0,0)',
    ctaVariantPrimary: 'outline',
    captionStyle: 'subtle',
  },
  Public: {
    accent: '#3b82f6', // blue-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
    gradientFrom: 'rgba(0,0,0,0)',
    gradientVia: '#3b82f6',
    gradientTo: 'rgba(0,0,0,0)',
    ctaVariantPrimary: 'outline',
    captionStyle: 'subtle',
  },
  Telecom: {
    accent: '#e20074', // T-Mobile magenta (brand-safe generic telecom accent)
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
    gradientFrom: 'rgba(0,0,0,0)',
    gradientVia: '#e20074',
    gradientTo: 'rgba(0,0,0,0)',
    ctaVariantPrimary: 'filled',
    captionStyle: 'badge',
  },
  eLearning: {
    accent: '#a855f7', // purple-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
    gradientFrom: 'rgba(0,0,0,0)',
    gradientVia: '#a855f7',
    gradientTo: 'rgba(0,0,0,0)',
    ctaVariantPrimary: 'outline',
    captionStyle: 'subtle',
  },
  Generic: {
    accent: '#14b8a6', // teal-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
    gradientFrom: 'rgba(0,0,0,0)',
    gradientVia: '#14b8a6',
    gradientTo: 'rgba(0,0,0,0)',
    ctaVariantPrimary: 'outline',
    captionStyle: 'subtle',
  },
}

export function getIndustryTheme(industry: Industry | 'Generic'): IndustryThemeTokens {
  return THEMES[industry] ?? THEMES.Generic
}

export function withOverrides(
  base: IndustryThemeTokens,
  overrides?: Partial<Pick<IndustryThemeTokens, 'accent' | 'headlineCase' | 'slashAngleDeg' | 'slashOffsetYRem' | 'captionStyle'>>
): IndustryThemeTokens {
  return { ...base, ...(overrides || {}) }
}
