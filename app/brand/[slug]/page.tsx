import type { Metadata } from 'next'

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
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <section className="mb-8">
        <h1 className="text-3xl font-semibold">Tailored overview for “{slug}”</h1>
        <p className="mt-3 text-neutral-600">
          This is a brand-aware, server-rendered landing. Content is neutral and template-based (no trademarked assets).
        </p>
      </section>

      <section className="space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-medium">Value proposition</h2>
          <p className="mt-2 text-neutral-700">
            We adapt the above-the-fold experience for your context while preserving performance, privacy and SEO.
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
