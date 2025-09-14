# Ingestion Runbook (Supabase)

This runbook explains how to ingest Markdown knowledge into Supabase (Postgres + pgvector) used by the chat endpoint `app/api/rag/query/route.ts`.

> Runtime uses ONLY anon keys. Service role is required here for writes during ingestion.

## 0) Prerequisites
- Supabase project with tables:
  - `public.documents(id uuid pk default gen_random_uuid(), source_name text, source_type text, role text, tech text[], org text, product text, domain text, kpis text[], aliases text[], link text, date date)`
  - `public.chunks(id uuid pk default gen_random_uuid(), document_id uuid references documents(id) on delete cascade, text text not null, embedding vector(1536) not null)`
- RPC functions are already deployed (see `docs/CONVERSATIONAL_RAG.md` §23). Not required for ingest but used by runtime.
- Local env for ingest (service role):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY` (to generate embeddings)

## 1) Content Authoring
- Author Markdown files under `data/rag/`.
- Use frontmatter metadata (YAML):
  ```md
  ---
  source_type: case_study # one of: case_study|leadership|experience|bio|faq|competency
  source_name: ING Business — SME Permission Management
  role: Head of Design
  tech: [Figma, TypeScript, pgvector]
  org: ING
  product: ING Business
  domain: finance
  kpis: [adoption, support_costs]
  aliases: [ING, ING Business]
  link: https://example.com/case/ing
  date: 2020-08-01
  ---
  ## Title
  Paragraph 1...
  Paragraph 2...
  ```

## 2) Chunking Philosophy
- Split on headings and paragraphs; target 500–1000 tokens per chunk.
- Preserve semantic boundaries.

## 3) Minimal Ingestion Script (TypeScript)
If you don’t yet have a dedicated ingest script in the repo, use the following one-off approach.

Create a file (temporary or under `scripts/ingest_supabase.ts`) with the code below and run it via `npx tsx`.

```ts
// Comments in English per project rules.
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const ROOT = path.resolve(process.cwd(), 'data/rag');
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const ai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function embed(text: string): Promise<number[]> {
  const res = await ai.embeddings.create({
    model: process.env.AI_MODEL_EMBEDDING || 'text-embedding-3-small',
    input: text,
  });
  return res.data[0].embedding as unknown as number[];
}

function simpleChunks(md: string): string[] {
  // Very simple chunker: split by double newline, merge small parts.
  const paras = md.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const chunks: string[] = [];
  let acc = '';
  for (const p of paras) {
    const next = acc ? acc + '\n\n' + p : p;
    if (next.length > 1800 && acc) { // ~450 tokens
      chunks.push(acc);
      acc = p;
    } else {
      acc = next;
    }
  }
  if (acc) chunks.push(acc);
  return chunks;
}

async function ingestOne(file: string) {
  const raw = await fs.readFile(file, 'utf8');
  const { data, content } = matter(raw);
  const meta = {
    source_name: data.source_name || path.basename(file),
    source_type: data.source_type || 'bio',
    role: data.role || null,
    tech: Array.isArray(data.tech) ? data.tech : null,
    org: data.org || null,
    product: data.product || null,
    domain: data.domain || null,
    kpis: Array.isArray(data.kpis) ? data.kpis : null,
    aliases: Array.isArray(data.aliases) ? data.aliases : null,
    link: data.link || null,
    date: data.date || null,
  };

  const { data: doc, error: derr } = await sb
    .from('documents')
    .insert(meta)
    .select('id')
    .single();
  if (derr) throw derr;

  const chunks = simpleChunks(content);
  for (const ch of chunks) {
    const emb = await embed(ch);
    const { error: cerr } = await sb
      .from('chunks')
      .insert({ document_id: doc.id, text: ch, embedding: emb as any });
    if (cerr) throw cerr;
  }
  console.log('Ingested', file, '→', chunks.length, 'chunks');
}

async function main() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const p = path.join(ROOT, e.name);
    if (e.isDirectory()) {
      const inner = await fs.readdir(p);
      for (const f of inner) if (f.endsWith('.md') || f.endsWith('.mdx')) files.push(path.join(p, f));
    } else if (e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.mdx'))) {
      files.push(p);
    }
  }
  for (const f of files) await ingestOne(f);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Run it:

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
OPENAI_API_KEY=... \
AI_MODEL_EMBEDDING=text-embedding-3-small \
npx tsx scripts/ingest_supabase.ts
```

> Notes:
> - This script is intentionally simple and synchronous for clarity. For larger corpora, batch embeddings and inserts.
> - If you prefer a zero‑embedding bootstrap (lexical‑only), you can insert `embedding` as a zero vector of length 1536 and backfill later.

## 4) Validation (Smoke)
After ingestion, validate the runtime with:

```bash
npx tsx scripts/smoke_queries.ts
```

Expect `200` responses, citations > 0, and p95 close to your targets.

## 5) Common Pitfalls
- `400 Invalid input` in runtime → verify RPC arg shapes and `vector(1536)`.
- `stack depth limit exceeded` in SQL Editor → remove wrapper functions with `(text, vector, ...)` signatures.
- `maintenance_work_mem` on adding `tsv` column → use inline `to_tsvector` in functions; no column needed.

