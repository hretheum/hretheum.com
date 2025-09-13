// Ingestion script: build data/index.json from Markdown in data/rag/**.md
// Documentation/comments in English per project rules.

import { promises as fs } from 'fs';
import path from 'path';
import {
  RAG_DIR,
  INDEX_PATH,
  chunkMarkdown,
  embedTexts,
  saveIndex,
  type RAGIndex,
  type RAGVector,
} from '../lib/rag';

// Lightweight .env loader (no external deps). Ensures OPENAI_API_KEY / AI_GATEWAY_API_KEY
// are available when running the script with `tsx` outside of Next.js runtime.
async function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const raw = await fs.readFile(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const eq = s.indexOf('=');
      if (eq === -1) continue;
      const key = s.slice(0, eq).trim();
      let val = s.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (_) {
    // .env missing is fine; rely on shell env
  }
}

async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) out.push(p);
    }
  }
  await walk(dir);
  return out;
}

function parseFrontmatter(md: string): { meta: Record<string, any>; body: string } {
  const fm = /^---\n([\s\S]*?)\n---\n?/m.exec(md);
  if (!fm) return { meta: {}, body: md.trim() };
  const raw = fm[1];
  const body = md.slice(fm[0].length).trim();
  const meta: Record<string, any> = {};
  // very small YAML subset parser (key: value, arrays like [a, b], strings)
  for (const line of raw.split('\n')) {
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (val.startsWith('[') && val.endsWith(']')) {
      const items = val.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      meta[key] = items.map((s) => s.replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
    } else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      meta[key] = val.slice(1, -1);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      meta[key] = val;
    } else if (/^(true|false)$/i.test(val)) {
      meta[key] = /^true$/i.test(val);
    } else if (/^-?\d+(\.\d+)?$/.test(val)) {
      meta[key] = Number(val);
    } else if (val === '' || val === null) {
      meta[key] = '';
    } else {
      meta[key] = val;
    }
  }
  return { meta, body };
}

async function ingest() {
  await loadEnvFile();
  const files = await walkMarkdownFiles(RAG_DIR);
  if (files.length === 0) {
    console.error(`[ingest] No markdown files found under ${RAG_DIR}`);
  }

  // Build vectors
  const vectors: RAGVector[] = [];
  const texts: string[] = [];
  const idxToVector: number[] = []; // map from texts[] index -> vectors index

  for (const fullPath of files) {
    const content = await fs.readFile(fullPath, 'utf-8');
    const relFile = path.relative(RAG_DIR, fullPath);
    const { meta, body } = parseFrontmatter(content);

    // Attach file path into metadata
    const baseMeta: Record<string, any> = { file: relFile, ...meta };

    const chunks = chunkMarkdown(body, { maxTokens: 900, overlap: 150 });
    for (let i = 0; i < chunks.length; i++) {
      const text = chunks[i];
      const id = `${relFile}#${i}`;
      const v: RAGVector = {
        id,
        text,
        metadata: baseMeta,
        embedding: null,
      };
      idxToVector.push(vectors.length);
      vectors.push(v);
      texts.push(text);
    }
  }

  // Embed in batches to avoid large payloads
  const batchSize = 64;
  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);
    const embs = await embedTexts(batch);
    for (let j = 0; j < embs.length; j++) {
      const globalIdx = start + j;
      const vIdx = idxToVector[globalIdx];
      vectors[vIdx].embedding = embs[j];
    }
    console.log(`[ingest] embedded ${Math.min(start + batchSize, texts.length)}/${texts.length}`);
  }

  const index: RAGIndex = { vectors };
  await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true });
  await saveIndex(index);
  console.log(`[ingest] Saved index with ${vectors.length} vectors to ${INDEX_PATH}`);
}

ingest().catch((err) => {
  console.error('[ingest] failed', err);
  process.exit(1);
});
