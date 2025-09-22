// Documentation: All comments and docstrings are in English per project policy.
// Industry theme tokens and helpers.

import type { Industry } from '@/lib/industry'

export type HeadlineCase = 'uppercase' | 'sentence'

export type IndustryThemeTokens = {
  accent: string
  headlineCase: HeadlineCase
  slashAngleDeg: number
  slashOffsetYRem: number
}

const THEMES: Record<Industry | 'Generic', IndustryThemeTokens> = {
  SaaS: {
    accent: '#6366f1', // indigo-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
  },
  Pharma: {
    accent: '#0ea5e9', // sky-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
  },
  FinTech: {
    accent: '#22c55e', // emerald-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
  },
  Commerce: {
    accent: '#f59e0b', // amber-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
  },
  Manufacturing: {
    accent: '#64748b', // slate-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
  },
  Public: {
    accent: '#3b82f6', // blue-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
  },
  Telecom: {
    accent: '#e20074', // T-Mobile magenta (brand-safe generic telecom accent)
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
  },
  eLearning: {
    accent: '#a855f7', // purple-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
  },
  Generic: {
    accent: '#14b8a6', // teal-500
    headlineCase: 'uppercase',
    slashAngleDeg: 12,
    slashOffsetYRem: -0.5,
  },
}

export function getIndustryTheme(industry: Industry | 'Generic'): IndustryThemeTokens {
  return THEMES[industry] ?? THEMES.Generic
}

export function withOverrides(
  base: IndustryThemeTokens,
  overrides?: Partial<Pick<IndustryThemeTokens, 'accent' | 'headlineCase' | 'slashAngleDeg' | 'slashOffsetYRem'>>
): IndustryThemeTokens {
  return { ...base, ...(overrides || {}) }
}
