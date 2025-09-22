// Campaign theming context for MDX-rendered components
// All comments/docstrings in English per project rules.

import React, { createContext, useContext } from 'react';
import type { IndustryThemeTokens } from '@/lib/theme/industryTheme';

const DEFAULT_TOKENS: IndustryThemeTokens = {
  accent: '#111827', // neutral-900
  headlineCase: 'uppercase',
  slashAngleDeg: 12,
  slashOffsetYRem: -0.5,
  gradientFrom: 'rgba(0,0,0,0)',
  gradientVia: '#111827',
  gradientTo: 'rgba(0,0,0,0)',
  ctaVariantPrimary: 'outline',
  captionStyle: 'subtle',
};

const CampaignThemeContext = createContext<IndustryThemeTokens>(DEFAULT_TOKENS);

export function useCampaignTheme() {
  return useContext(CampaignThemeContext);
}

export function CampaignThemeProvider({ tokens, children }: { tokens?: Partial<IndustryThemeTokens>; children: React.ReactNode }) {
  const value: IndustryThemeTokens = { ...DEFAULT_TOKENS, ...(tokens || {}) } as IndustryThemeTokens;
  return <CampaignThemeContext.Provider value={value}>{children}</CampaignThemeContext.Provider>;
}
