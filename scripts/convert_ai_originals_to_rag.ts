// Comments in English per project rules.
// Simple converter: data/ai_originals/*.mdx -> data/rag/*.md (strip MDX/JSX, keep headings/text)

import fs from 'node:fs/promises'
import path from 'node:path'

async function ensureDir(p: string) {
  try { await fs.mkdir(p, { recursive: true }) } catch {}
}

function mdxToMd(mdx: string): string {
  let s = mdx
  // remove import/export lines
  s = s.replace(/^\s*import\s+.*$/gm, '')
  s = s.replace(/^\s*export\s+.*$/gm, '')
  // remove jsx blocks like <Component ...>...</Component> while keeping inner text best-effort
  s = s.replace(/<[^>]+>/g, match => {
    // Replace tags with nothing; content remains outside tags
    return ''
  })
  // collapse multiple blank lines
  s = s.replace(/\n{3,}/g, '\n\n')
  // trim
  s = s.trim() + '\n'
  return s
}

async function run() {
  const srcDir = path.resolve(process.cwd(), 'data/ai_originals')
  const dstDir = path.resolve(process.cwd(), 'data/rag')
  await ensureDir(dstDir)
  let entries: any[] = []
  try {
    entries = await fs.readdir(srcDir, { withFileTypes: true })
  } catch {
    console.error('[convert] data/ai_originals not found')
    process.exit(1)
  }
  const files: string[] = []
  for (const e of entries) {
    if (e.isFile() && (e.name.endsWith('.mdx') || e.name.endsWith('.md'))) {
      files.push(path.join(srcDir, e.name))
    }
  }
  if (files.length === 0) {
    console.log('[convert] No MDX/MD files in data/ai_originals')
    return
  }
  for (const f of files) {
    const raw = await fs.readFile(f, 'utf8')
    const md = mdxToMd(raw)
    const base = path.parse(f).name.replace(/\s+/g, '_').toLowerCase()
    const out = path.join(dstDir, `${base}.md`)
    await fs.writeFile(out, md, 'utf8')
    console.log('[convert] Wrote', out)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
