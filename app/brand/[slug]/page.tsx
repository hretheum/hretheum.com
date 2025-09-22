import type { Metadata } from 'next'
import RedirectBeacon from './RedirectBeacon'
import { resolveIndustrySSR } from '@/lib/industry_server'
import { IndustryHero } from '../_components/IndustryHero'
import Content from '@/app/components/Content'

const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com'

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const slug = params?.slug || ''
  const canonical = `https://${APEX_DOMAIN}/brand/${encodeURIComponent(slug)}`
  return {
    title: `Brand – ${slug}`,
    description: `Brand-adaptive landing for ${slug}. Neutral, template-based content without trademarked assets.`,
    alternates: { canonical },
  }
}

export default async function BrandPage({ params }: any) {
  const slug = params?.slug || ''
  const { industry, source } = await resolveIndustrySSR(slug)
  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <RedirectBeacon />
        <IndustryHero industry={industry} slug={slug} source={source} />

        <section className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-medium">Value proposition</h2>
            <p className="mt-2 text-neutral-700">
              We adapt the experience for your context while preserving performance, privacy and SEO.
            </p>
          </div>
        </section>
      </main>
      {/* Full homepage content below brand hero */}
      <Content />
    </>
  )
}
