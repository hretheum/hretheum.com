'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import type { MediaAttachment } from '@/lib/aiOriginalsMedia'

type AIOriginalItem = {
  slug: string
  title: string
  subtitle?: string
  summary: string
  tags?: string[]
  metric?: { label: string; value: string }
  cta?: { label: string; href: string }
  contentHtml: string
  media?: MediaAttachment[]
}

type Props = {
  items: AIOriginalItem[]
}

export function AIOriginalsShowcase({ items }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const activeItem = items.find((item) => item.slug === activeSlug) || null

  const closeModal = useCallback(() => setActiveSlug(null), [])

  useEffect(() => {
    if (!activeItem) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeItem, closeModal])

  useEffect(() => {
    if (!activeItem) return
    let cancelled = false
    ;(async () => {
      try {
        const mod: any = await import('mermaid')
        if (cancelled) return
        const mermaid = mod.default ?? mod

        const rootStyles = getComputedStyle(document.documentElement)
        const rawAccent = rootStyles.getPropertyValue('--campaign-accent')?.trim()
        const accent = rawAccent || '#111827'

        // Silence global overlay: keep errors in console only
        ;(mermaid as any).parseError = (err: unknown) => {
          console.error('[Mermaid parse error]', err)
        }
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'neutral',
          themeVariables: {
            primaryColor: accent,
            primaryTextColor: '#0f172a',
            primaryBorderColor: accent,
            lineColor: accent,
            secondaryColor: '#f8fafc',
            tertiaryColor: '#fff',
            edgeLabelBackground: '#f8fafc',
            clusterBkg: '#ffffff',
            clusterBorder: accent,
            fontFamily: '"Suisse Intl", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: '14px',
          },
        })
        const root = document.querySelector<HTMLElement>('.ai-originals-modal')
        const nodes = root ? Array.from(root.querySelectorAll<HTMLElement>('.mermaid')) : []
        if (!nodes.length) return

        console.debug('[AIOriginalsShowcase] Mermaid nodes detected (scoped to modal)', {
          count: nodes.length,
          ids: nodes.map((n) => n.id),
        })

        await Promise.all(
          nodes.map(async (node, index) => {
            const encodedDefinition = node.dataset.definition || ''
            const definition = encodedDefinition
              ? decodeURIComponent(encodedDefinition)
              : (node.textContent || '').trim()
            if (!definition) return

            if (!node.dataset.definition && definition) {
              node.dataset.definition = encodeURIComponent(definition)
            }

            const renderKey = `${activeItem.slug}-mermaid-${index}`
            if (node.dataset.rendered === renderKey) return

            node.innerHTML = ''

            try {
              console.debug('[AIOriginalsShowcase] Mermaid rendering start', {
                renderKey,
                definition,
              })
              const { svg, bindFunctions } = await mermaid.render(renderKey, definition)
              node.innerHTML = svg
              bindFunctions?.(node)
              node.dataset.rendered = renderKey
              console.debug('[AIOriginalsShowcase] Mermaid rendered successfully', { renderKey })
              if (!node.querySelector('svg')) {
                throw new Error('Mermaid returned no SVG')
              }
            } catch (renderErr) {
              console.warn('[AIOriginalsShowcase] Mermaid render failed, falling back to run()', renderErr, {
                renderKey,
              })
              try {
                node.textContent = definition
                await mermaid.run({ nodes: [node] })
                node.dataset.rendered = renderKey + '-run'
                console.debug('[AIOriginalsShowcase] Mermaid run() fallback succeeded', { renderKey })
              } catch (runErr) {
                console.error('[AIOriginalsShowcase] Mermaid fallback run() failed', runErr, {
                  renderKey,
                })
              }
            }
          })
        )
      } catch (err) {
        console.error('Mermaid rendering failed', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeItem])

  return (
    <>
      <div className="not-prose">
        <div className="mb-10 text-center">
          <h2 className="text-[clamp(2rem,7vw,4rem)] font-black tracking-tight text-neutral-900 leading-[0.95] uppercase">
            AI Originals
          </h2>
          <p className="mt-3 text-sm md:text-base text-neutral-600 max-w-2xl mx-auto">
            Proprietary AI-native productions — automated pipelines, custom orchestration, measurable storytelling impact.
          </p>
        </div>
        <div className="columns-1 md:columns-2 [column-gap:2rem] [column-fill:_balance]">
          {items.map((item) => (
            <div key={item.slug} className="mb-8 break-inside-avoid">
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setActiveSlug(item.slug)}
                  className="group relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white text-left shadow-[0_28px_60px_-55px_rgba(15,23,42,0.55)] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 w-full"
                >
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--campaign-accent)' }} />
                  <div className="px-8 py-10 space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1 text-[11px] font-semibold tracking-[0.28em] text-neutral-500 uppercase">
                      AI Original
                    </div>
                    <div>
                  <h3 className="text-[clamp(1.5rem,5vw,2.5rem)] font-black tracking-tight text-neutral-900 leading-tight">
                    {item.title}
                  </h3>
                  {item.subtitle && <p className="mt-1 text-sm uppercase tracking-[0.28em] text-neutral-500">{item.subtitle}</p>}
                </div>
                <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
                  {item.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.tags?.map((tag) => (
                    <span
                      key={`${item.slug}_${tag}`}
                      className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.28em] uppercase text-neutral-700"
                      style={{
                        background: 'color-mix(in srgb, var(--campaign-accent) 12%, transparent)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {item.metric && (
                  <div className="flex items-center gap-3 text-neutral-800">
                    <div className="text-3xl font-black">{item.metric.value}</div>
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">{item.metric.label}</div>
                  </div>
                )}
                <div className="text-sm font-semibold text-neutral-900 uppercase tracking-[0.3em]">
                  Tap to open playbook →
                </div>
              </div>
              </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90svh] w-full max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--campaign-accent)' }} />
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-6 top-6 z-10 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-600 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.6)] backdrop-blur-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              Close
            </button>
            <div className="max-h-[90svh] overflow-y-auto px-8 py-10 md:px-12 md:py-12 space-y-8">
              <header className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-[clamp(2rem,5vw,3rem)] font-black tracking-tight text-neutral-900 leading-tight">
                    {activeItem.title}
                  </h3>
                  {activeItem.subtitle && (
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                      {activeItem.subtitle}
                    </p>
                  )}
                  {activeItem.metric && (
                    <div className="flex items-center gap-3 text-neutral-800">
                      <div className="text-4xl font-black">{activeItem.metric.value}</div>
                      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">{activeItem.metric.label}</div>
                    </div>
                  )}
                </div>
              </header>

              <article
                className="ai-originals-modal prose prose-zinc max-w-none space-y-6 prose-p:text-neutral-700 prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5"
                dangerouslySetInnerHTML={{ __html: activeItem.contentHtml }}
              />

              {activeItem.media && activeItem.media.length > 0 && (
                <section className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500">Reference media</h4>
                    <span className="text-[10px] uppercase tracking-[0.32em] text-neutral-400">{activeItem.media.length} asset{activeItem.media.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="space-y-6">
                    {activeItem.media.map((asset) => (
                      <figure
                        key={asset.id}
                        className="group overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.55)] transition-transform duration-200 hover:-translate-y-1"
                      >
                        <div className="relative aspect-video overflow-hidden bg-neutral-900">
                          {asset.type === 'video' ? (
                            <video
                              src={asset.url}
                              controls
                              preload="metadata"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Image src={asset.url} alt={asset.title} fill className="object-cover" unoptimized />
                          )}
                        </div>
                        <figcaption className="p-5 space-y-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-neutral-500">{asset.type}</div>
                          <div className="text-sm font-semibold text-neutral-900">{asset.title}</div>
                          {asset.description && (
                            <p className="text-xs text-neutral-600 leading-relaxed">{asset.description}</p>
                          )}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .ai-originals-modal h2,
        .ai-originals-modal h3 {
          position: relative;
          display: inline-block;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.45em;
          color: #0f172a;
          padding-left: 1.25rem;
        }

        .ai-originals-modal h2 {
          font-size: clamp(0.8rem, 1vw, 1rem);
          margin-top: 3.75rem;
          margin-bottom: 1.9rem;
        }

        .ai-originals-modal h3 {
          font-size: clamp(0.68rem, 0.85vw, 0.85rem);
          letter-spacing: 0.38em;
          color: #1f2937;
          margin-top: 3rem;
          margin-bottom: 1.4rem;
        }

        .ai-originals-modal h2::before,
        .ai-originals-modal h3::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 0.4rem;
          height: 130%;
          border-radius: 999px;
          background: var(--campaign-accent, #0f172a);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--campaign-accent, #0f172a) 16%, transparent);
        }

        .ai-originals-modal h2:first-of-type {
          margin-top: 2.5rem;
        }

        .ai-originals-modal h2 + *,
        .ai-originals-modal h3 + * {
          margin-top: 0.75rem !important;
        }

        .ai-originals-modal .mermaid {
          margin-top: 2.25rem;
          padding: 1.75rem;
          border-radius: 28px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--campaign-accent, #0f172a) 10%, #f8fafc), #ffffff 65%);
          border: 1px solid color-mix(in srgb, var(--campaign-accent, #0f172a) 20%, #e2e8f0);
          box-shadow: 0 24px 55px -35px rgba(15, 23, 42, 0.35);
        }

        .ai-originals-modal .mermaid svg {
          width: 100%;
          height: auto;
          font-family: 'Suisse Intl', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .ai-originals-modal .mermaid .node rect,
        .ai-originals-modal .mermaid .node polygon {
          fill: color-mix(in srgb, var(--campaign-accent, #0f172a) 5%, #ffffff);
          stroke: color-mix(in srgb, var(--campaign-accent, #0f172a) 55%, #1f2937);
          stroke-width: 1.5px;
          rx: 14px;
          ry: 14px;
        }

        .ai-originals-modal .mermaid .node text {
          fill: #0f172a;
          font-size: 13px;
          font-weight: 600;
        }

        .ai-originals-modal .mermaid .edgePath path {
          stroke: color-mix(in srgb, var(--campaign-accent, #0f172a) 65%, #64748b);
          stroke-width: 1.4px;
        }

        .ai-originals-modal .mermaid .edgeLabel {
          color: #1f2937;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }

        .ai-originals-modal .mermaid .marker {
          fill: color-mix(in srgb, var(--campaign-accent, #0f172a) 65%, #64748b);
        }
      `}</style>
    </>
  )
}
