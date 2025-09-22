import type { Metadata } from 'next'
import RedirectBeacon from './[slug]/RedirectBeacon'

const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com'

export const metadata: Metadata = {
  title: 'Brand – Generic',
  description: 'Generic brand landing. Neutral, template-based content.',
  alternates: { canonical: `https://${APEX_DOMAIN}/brand` },
}

export default function BrandIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <RedirectBeacon />
      <section className="mb-8">
        <h1 className="text-3xl font-semibold">Brand landing</h1>
        <p className="mt-3 text-neutral-600">
          We could not resolve a specific brand slug. This is a generic, neutral landing.
        </p>
      </section>

      <section className="space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-medium">Overview</h2>
          <p className="mt-2 text-neutral-700">
            Explore the platform and see how we adapt the experience while preserving performance and privacy.
          </p>
        </div>
      </section>
    </main>
  )
}
