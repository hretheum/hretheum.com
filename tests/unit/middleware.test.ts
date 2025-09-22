import { describe, it, expect } from 'vitest'
import { normalizeSlug, getHostname } from '../../middleware'

function mockReq(headers: Record<string, string>, url: string = 'https://hretheum.com/') {
  return {
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
    nextUrl: new URL(url),
  } as any
}

describe('normalizeSlug', () => {
  it('lowercases and trims', () => {
    expect(normalizeSlug('Foo')).toBe('foo')
    expect(normalizeSlug('-foo--bar-')).toBe('foo-bar')
  })
  it('rejects invalid chars and empty', () => {
    expect(normalizeSlug('foo_bar')).toBe('foobar') // underscore removed
    expect(normalizeSlug('')).toBeNull()
  })
  it('rejects punycode', () => {
    expect(normalizeSlug('xn--idn')).toBeNull()
  })
  it('length constraints', () => {
    expect(normalizeSlug('a'.repeat(64))).toBeNull()
    expect(normalizeSlug('a'.repeat(63))).toBe('a'.repeat(63))
  })
})

describe('getHostname', () => {
  it('prefers x-forwarded-host', () => {
    const req = mockReq({ 'x-forwarded-host': 'foo.hretheum.com', host: 'example.com' })
    expect(getHostname(req)).toBe('foo.hretheum.com')
  })
  it('strips port', () => {
    const req = mockReq({ host: 'foo.hretheum.com:443' })
    expect(getHostname(req)).toBe('foo.hretheum.com')
  })
  it('falls back to nextUrl hostname', () => {
    const req = mockReq({}, 'https://bar.hretheum.com/path')
    expect(getHostname(req)).toBe('bar.hretheum.com')
  })
})
