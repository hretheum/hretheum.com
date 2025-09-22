import type { Metadata } from 'next'
import RedirectBeacon from './RedirectBeacon'
import { resolveIndustry } from '@/lib/industry'
import { IndustryHero } from '../_components/IndustryHero'

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

export default function BrandPage({ params }: any) {
  const slug = params?.slug || ''
  const industry = resolveIndustry(slug)
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <RedirectBeacon />
      <IndustryHero industry={industry} slug={slug} />

      <section className="space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-medium">Value proposition</h2>
          <p className="mt-2 text-neutral-700">
            We adapt the experience for your context while preserving performance, privacy and SEO.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-medium">Suggested next steps</h2>
          <ul className="mt-2 list-disc pl-5 text-neutral-700">
            <li>Explore relevant case studies (industry-neutral templates).</li>
            <li>Start with guided suggestions or ask a question in the assistant.</li>
            <li>Schedule a short demo focused on your environment.</li>
          </ul>
        </div>
      </section>

      <section className="mt-10 rounded-lg border p-4">
        <h3 className="text-base font-semibold">Disclaimer</h3>
        <p className="mt-2 text-sm text-neutral-600">
          References to the brand name are textual only for contextualization. No endorsement or association is implied.
        </p>
      </section>
    </main>
  )
}
