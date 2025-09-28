import { describe, it, expect } from 'vitest'
import {
  ssrHeroUpdate,
  ssrDebugLog,
  csrTelemetryEnableDebug,
  csrTelemetrySuppressEvent,
  csrTagAppend,
  csrUiTooltip,
  csrUiNoviceDisclosure,
  ragFlagLowConfidence,
  ragRespondRequestClarification,
  ragMetaAttach,
} from '@/lib/rules/actions'
import type { CsrRuleContext, RagRuleContext, SsrRuleContext } from '@/lib/rules/types'

const ssrCtx = { scope: 'ssr' } as SsrRuleContext
const csrCtx = { scope: 'csr', consentGranted: true, device: 'desktop', debugBrands: [] } as CsrRuleContext
const ragCtx = { scope: 'rag', intentId: 'x', confidence: 0.1, messagePreview: '', thresholdLowConfidence: 0.5 } as RagRuleContext

describe('action factories', () => {
  it('ssr factories emit correct payloads', () => {
    const a = ssrHeroUpdate({ heroHeadline: 'H', showCtaOnMobile: false })(ssrCtx)
    expect(a.type).toBe('ssr.hero.update')
    expect(a.payload?.heroHeadline).toBe('H')
    expect(a.payload?.showCtaOnMobile).toBe(false)

    const d = ssrDebugLog('m')(ssrCtx)
    expect(d.type).toBe('ssr.debug.log')
    expect(d.payload?.message).toBe('m')
  })

  it('csr factories emit correct payloads', () => {
    const e = csrTelemetryEnableDebug('why')(csrCtx)
    expect(e.type).toBe('csr.telemetry.enable_debug')
    expect(e.payload?.reason).toBe('why')

    const s = csrTelemetrySuppressEvent('evt')(csrCtx)
    expect(s.type).toBe('csr.telemetry.suppress_event')
    expect(s.payload?.event).toBe('evt')

    const t = csrTagAppend('x')(csrCtx)
    expect(t.type).toBe('csr.tag.append')
    expect(t.payload?.tag).toBe('x')

    const tip = csrUiTooltip('primary_cta', 'msg')(csrCtx)
    expect(tip.type).toBe('csr.ui.tooltip')
    expect(tip.payload?.target).toBe('primary_cta')
    expect(tip.payload?.message).toBe('msg')

    const nov = csrUiNoviceDisclosure(true)(csrCtx)
    expect(nov.type).toBe('csr.ui.novice_disclosure')
    expect(nov.payload?.enable).toBe(true)
  })

  it('rag factories emit correct payloads', () => {
    const f = ragFlagLowConfidence(true)(ragCtx)
    expect(f.type).toBe('rag.flag.low_confidence')
    expect(f.payload?.value).toBe(true)

    const r = ragRespondRequestClarification('hm')(ragCtx)
    expect(r.type).toBe('rag.respond.request_clarification')
    expect(r.payload?.message).toBe('hm')

    const m = ragMetaAttach({ a: 1 })(ragCtx)
    expect(m.type).toBe('rag.meta.attach')
    expect(m.payload?.a).toBe(1)
  })
})
