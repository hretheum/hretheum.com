import { test, expect, request } from '@playwright/test'

const APEX = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'hretheum.com'

function url(base: string, path: string) {
  return base.replace(/\/$/, '') + path
}

test.describe('Subdomain redirect middleware', () => {
  test.skip(!process.env.REDIRECT_E2E_BASE, 'REDIRECT_E2E_BASE not set')

  test('valid single-label subdomain redirects to /brand/<slug> and preserves UTM', async ({ request }) => {
    const base = process.env.REDIRECT_E2E_BASE!
    const utm = '?utm_source=test&utm_medium=e2e'
    const res = await request.get(url(base, '/' + utm), {
      headers: { 'x-forwarded-host': `acme.${APEX}` },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(301)
    const loc = res.headers()['location'] || res.headers()['Location']
    expect(loc).toBe(`https://${APEX}/brand/acme${utm}`)
  })

  test('reserved subdomain does not redirect to /brand', async ({ request }) => {
    const base = process.env.REDIRECT_E2E_BASE!
    const res = await request.get(url(base, '/'), {
      headers: { 'x-forwarded-host': `admin.${APEX}` },
      maxRedirects: 0,
    })
    expect(res.status()).not.toBe(301)
    // should set noindex on reserved
    expect(res.headers()['x-robots-tag'] || res.headers()['X-Robots-Tag']).toContain('noindex')
  })

  test('multi-label subdomain redirects to /brand (no slug)', async ({ request }) => {
    const base = process.env.REDIRECT_E2E_BASE!
    const res = await request.get(url(base, '/?q=1'), {
      headers: { 'x-forwarded-host': `a.b.${APEX}` },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(301)
    const loc = res.headers()['location'] || res.headers()['Location']
    expect(loc).toBe(`https://${APEX}/brand?q=1`)
    // noindex and short cache on 301
    expect(res.headers()['x-robots-tag'] || res.headers()['X-Robots-Tag']).toContain('noindex')
    const cc = res.headers()['cache-control'] || res.headers()['Cache-Control']
    expect((cc || '').toLowerCase()).toContain('max-age=300')
  })

  test('IDN/punycode label redirects to /brand (no slug)', async ({ request }) => {
    const base = process.env.REDIRECT_E2E_BASE!
    const res = await request.get(url(base, '/'), {
      headers: { 'x-forwarded-host': `xn--idn.${APEX}` },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(301)
    const loc = res.headers()['location'] || res.headers()['Location']
    expect(loc).toBe(`https://${APEX}/brand`)
  })
})
