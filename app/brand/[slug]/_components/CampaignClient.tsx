"use client";
// Client-side MDX renderer for development fallback.
// Renders compiledSource via next-mdx-remote to avoid React 19 dev runtime mismatch.

import React from 'react'
import { MDXRemote } from 'next-mdx-remote'
import {
  CTABanner,
  CTAGroup,
  CampaignMeta,
  CaseGrid,
  CaseStudyRich,
  ExperienceItem,
  MetricsGrid,
  MetricsStrip,
  OutcomeBanner,
  Playbook,
  Quote,
  SectionTitle,
  Timeline,
  ClosingBanner,
  KeywordsBlock,
} from './campaign-components.client'

const components = {
  CTABanner,
  CTAGroup,
  CampaignMeta,
  CaseGrid,
  CaseStudyRich,
  ExperienceItem,
  MetricsGrid,
  MetricsStrip,
  OutcomeBanner,
  Playbook,
  Quote,
  SectionTitle,
  Timeline,
  ClosingBanner,
  KeywordsBlock,
}

export default function CampaignClient({ compiledSource, frontmatter, scope }: { compiledSource: string; frontmatter?: any; scope?: any }) {
  return <MDXRemote compiledSource={compiledSource as any} frontmatter={frontmatter as any} scope={scope as any} components={components as any} />
}
