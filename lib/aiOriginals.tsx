// Documentation: all comments/docstrings in English per policy.
// Helpers to load AI Originals storytelling content from data/ai_originals/*.mdx

// Force Node.js runtime for file system operations
export const runtime = 'nodejs'

import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { getMediaAttachments, MediaAttachment } from './aiOriginalsMedia'

const ROOT = process.cwd()
const AI_ORIGINALS_DIR = path.join(ROOT, 'data', 'ai_originals')

const ZHero = z
  .object({
    title: z.string(),
    subtitle: z.string().optional(),
    summary: z.string().optional(),
    metric: z
      .object({
        label: z.string(),
        value: z.string(),
      })
      .optional(),
  })
  .optional()

const ZAIOriginalFrontmatter = z.object({
  slug: z.string().optional(),
  brand: z.string().optional(),
  industry: z.string().optional(),
  accent: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  period: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hero: ZHero,
  cta: z
    .object({
      label: z.string(),
      href: z.string().url(),
    })
    .optional(),
})

export type AIOriginalItem = {
  slug: string
  title: string
  subtitle?: string
  summary: string
  tags: string[]
  metric?: { label: string; value: string }
  cta?: { label: string; href: string }
  contentHtml: string
  media?: MediaAttachment[]
}

async function listMdxFiles(): Promise<string[]> {
  try {
    const entries = await fs.readdir(AI_ORIGINALS_DIR)
    return entries.filter((entry) => entry.toLowerCase().endsWith('.mdx'))
  } catch {
    return []
  }
}

export async function loadAIOriginals(): Promise<AIOriginalItem[]> {
  const files = await listMdxFiles()
  const items: AIOriginalItem[] = []

  for (const file of files) {
    const filePath = path.join(AI_ORIGINALS_DIR, file)
    const raw = await fs.readFile(filePath, 'utf8')
    const { content: body, data } = matter(raw)

    const parsed = ZAIOriginalFrontmatter.safeParse(data || {})
    if (!parsed.success) {
      console.warn('[loadAIOriginals] Invalid frontmatter', filePath, parsed.error)
      continue
    }

    const fm = parsed.data
    const hero = fm.hero || { title: file.replace(/\.mdx$/, '') }
    const slug = (fm.slug || file.replace(/\.mdx$/, '')).toLowerCase()

    const processed = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(() => (tree: any) => {
        visit(tree, 'code', (node: any) => {
          if (node.lang === 'mermaid') {
            const encoded = encodeURIComponent(node.value)
            node.type = 'html'
            node.value = `<div class="mermaid" data-definition="${encoded}"></div>`
            delete node.lang
          }
        })
      })
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(body)

    const contentHtml = String(processed)

    items.push({
      slug,
      title: hero.title,
      subtitle: hero.subtitle,
      summary: hero.summary || '',
      tags: fm.tags || [],
      metric: hero.metric,
      cta: fm.cta,
      contentHtml,
      media: getMediaAttachments(slug),
    })
  }

  return items
}
