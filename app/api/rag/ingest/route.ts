// Force Node.js runtime for file system operations
export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Types
export type RAGVector = {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding: number[] | null;
}

export type RAGIndex = {
  vectors: RAGVector[];
}

// Constants
export const DATA_DIR = path.join(process.cwd(), 'data');
export const RAG_DIR = path.join(DATA_DIR, 'rag');
export const INDEX_PATH = path.join(DATA_DIR, 'index.json');

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY,
  baseURL: process.env.AI_GATEWAY_API_KEY ? 'https://ai-gateway.vercel.sh/v1' : undefined,
})

// Helper functions
export function chunkMarkdown(md: string, opts?: { maxTokens?: number; overlap?: number }): string[] {
  const maxTokens = opts?.maxTokens || 900;
  const overlap = opts?.overlap || 150;

  // Simple chunking by paragraphs for now
  const paragraphs = md.split('\n\n').filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxTokens) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map(item => item.embedding);
}

export async function saveIndex(index: RAGIndex) {
  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
}

// Ingestion route: parses Markdown files from data/rag, chunks them, embeds, and writes data/index.json
export async function POST() {
  try {
    // Ensure directories exist
    try { await fs.mkdir(RAG_DIR, { recursive: true }); } catch {}
    try { await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true }); } catch {}

    // Read all markdown files in data/rag
    const entries = await fs.readdir(RAG_DIR);
    const mdFiles = entries.filter((f) => f.toLowerCase().endsWith('.md'));
    if (mdFiles.length === 0) {
      // Keep previous index if exists; otherwise write empty
      try { await fs.access(INDEX_PATH); } catch { await fs.writeFile(INDEX_PATH, JSON.stringify({ vectors: [] }, null, 2)); }
      return NextResponse.json({ ok: true, message: 'No markdown files found in data/rag', index: 'data/index.json' });
    }

    // Build chunks with metadata
    const pendingVectors: RAGVector[] = [];
    for (const file of mdFiles) {
      const full = path.join(RAG_DIR, file);
      const content = await fs.readFile(full, 'utf-8');
      const chunks = chunkMarkdown(content, { maxTokens: 900, overlap: 150 });
      let i = 0;
      for (const ch of chunks) {
        const id = `${path.parse(file).name}-${++i}`;
        const vec: RAGVector = {
          id,
          text: ch,
          metadata: {
            source_type: inferSourceType(file, ch),
            source_name: path.parse(file).name,
            role: inferRole(ch),
            tech: inferTech(ch),
            date: null,
            link: null,
            file,
          },
          embedding: null,
        };
        pendingVectors.push(vec);
      }
    }

    // Embed in batches to avoid long requests
    const batchSize = 64;
    for (let start = 0; start < pendingVectors.length; start += batchSize) {
      const slice = pendingVectors.slice(start, start + batchSize);
      const embeddings = await embedTexts(slice.map((v) => v.text));
      embeddings.forEach((e: number[], idx: number) => { slice[idx].embedding = e; });
    }

    const index: RAGIndex = { vectors: pendingVectors };
    await saveIndex(index);

    return NextResponse.json({ ok: true, count: index.vectors.length, index: 'data/index.json' });
  } catch (err) {
    console.error('Ingest error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Heuristics to infer basic metadata from content
function inferSourceType(file: string, text: string): string {
  const f = file.toLowerCase();
  if (f.includes('lead') || /leadership|playbook/i.test(text)) return 'leadership';
  if (/case study|outcome|approach|challenge/i.test(text)) return 'case_study';
  if (/sportradar|ing|deloitte|bank|warta|pko|telekom|t\-mobile|plus\.pl|tvp/i.test(text)) return 'experience';
  if (/summary|profile|keywords/i.test(text)) return 'bio';
  return 'content';
}

function inferRole(text: string): string | null {
  const m = text.match(/(Lead|Leader|Director|Manager|Principal|Founder)/i);
  return m ? m[0] : null;
}

function inferTech(text: string): string[] {
  const tech: string[] = [];
  const add = (k: string) => { if (!tech.includes(k)) tech.push(k); };
  if (/design system/i.test(text)) add('Design Systems');
  if (/usability|user test/i.test(text)) add('Usability');
  if (/journey|persona|research/i.test(text)) add('Research');
  if (/prototype|wireframe/i.test(text)) add('Prototyping');
  if (/analytics|conversion/i.test(text)) add('Analytics');
  if (/ai|rag|llm|mcp/i.test(text)) add('AI');
  return tech;
}
