// Utilities for RAG: chunking, embeddings, similarity
// All documentation/comments are in English per project rule.

import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';

export type RAGVector = {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding: number[] | null;
};

export type RAGIndex = {
  vectors: RAGVector[];
};

export const DATA_DIR = path.join(process.cwd(), 'data');
export const RAG_DIR = path.join(DATA_DIR, 'rag');
export const INDEX_PATH = path.join(DATA_DIR, 'index.json');

export function getEnvEmbeddingModel() {
  return process.env.AI_MODEL_EMBEDDINGS || 'text-embedding-3-small';
}

export async function embedQuery(text: string) {
  const [vec] = await embedTexts([text]);
  return vec;
}

export function buildAnswerPrompt(question: string, contexts: { text: string; metadata: Record<string, any> }[]) {
  const sources = contexts
    .map((c, i) => `Source ${i + 1} (${c.metadata.source_name || c.metadata.file || 'unknown'}):\n${c.text}`)
    .join('\n\n');
  const sys = `You are Eryk's recruiting assistant.
- Answer concisely and clearly. Prefer short paragraphs and bullet lists.
- Do NOT use tables. Do NOT invent headings. Keep the structure simple and readable.
- Use only the provided sources; do not speculate.
- If evidence is weak, say so briefly and suggest a next step.
- Do NOT include a Sources section in your output; it will be added by the system UI.
`;
  const usr = `Question:\n${question}\n\nRelevant source excerpts:\n${sources}\n\nPlease respond with only the direct answer (short intro + up to 5 bullet points if helpful). Do not include a Sources section.`;
  return { system: sys, user: usr };
}

export function getEnvGenerationModel() {
  return process.env.AI_MODEL_GENERATION || 'gpt-4o-mini';
}

export function getTopK() {
  const v = Number(process.env.RAG_TOP_K || '5');
  return Number.isFinite(v) && v > 0 ? Math.min(10, v) : 5;
}

export function getSimilarityThreshold() {
  const v = Number(process.env.RAG_SIMILARITY_THRESHOLD || '0.72');
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.72;
}

// Very simple Markdown chunking: split by headings and paragraphs, respect size limits
export function chunkMarkdown(md: string, opts?: { maxTokens?: number; overlap?: number }) {
  const maxTokens = opts?.maxTokens ?? 900; // rough token proxy by characters/4
  const overlap = opts?.overlap ?? 150;
  const paras = md
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';
  for (const p of paras) {
    const isHeader = /^#{1,6}\s/.test(p);
    const pLen = Math.ceil(p.length / 4);
    const currLen = Math.ceil(current.length / 4);
    if (isHeader || currLen + pLen > maxTokens) {
      if (current) chunks.push(current.trim());
      current = p;
    } else {
      current += (current ? '\n\n' : '') + p;
    }
  }
  if (current) chunks.push(current.trim());

  // add simple overlap by prefixing last N chars of previous chunk
  if (overlap > 0 && chunks.length > 1) {
    const withOverlap: string[] = [];
    const charOverlap = overlap * 4; // approximate
    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        withOverlap.push(chunks[i]);
      } else {
        const prev = chunks[i - 1];
        const prefix = prev.slice(Math.max(0, prev.length - charOverlap));
        withOverlap.push(prefix + '\n\n' + chunks[i]);
      }
    }
    return withOverlap;
  }
  return chunks;
}

export async function readAllMarkdownFiles() {
  const entries = await fs.readdir(RAG_DIR);
  const files = entries.filter((f) => f.toLowerCase().endsWith('.md'));
  const results: { file: string; content: string }[] = [];
  for (const f of files) {
    const full = path.join(RAG_DIR, f);
    const content = await fs.readFile(full, 'utf-8');
    results.push({ file: f, content });
  }
  return results;
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) + 1e-12;
  return dot / denom;
}

export function rankBySimilarity(query: number[], index: RAGVector[]) {
  const scored = index
    .filter((v) => Array.isArray(v.embedding) && v.embedding.length > 0)
    .map((v) => ({ v, score: cosineSimilarity(query, v.embedding as number[]) }))
    .sort((a, b) => b.score - a.score);
  return scored;
}

export async function ensureIndexExists() {
  try {
    await fs.access(INDEX_PATH);
  } catch {
    const empty: RAGIndex = { vectors: [] };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(INDEX_PATH, JSON.stringify(empty, null, 2), 'utf-8');
  }
}

export async function loadIndex(): Promise<RAGIndex> {
  await ensureIndexExists();
  const raw = await fs.readFile(INDEX_PATH, 'utf-8');
  return JSON.parse(raw) as RAGIndex;
}

export async function saveIndex(index: RAGIndex) {
  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8');
}

export async function embedTexts(texts: string[]) {
  const model = getEnvEmbeddingModel();
  const client = getOpenAIClient();
  const res = await client.embeddings.create({ model, input: texts });
  return res.data.map((d) => d.embedding as number[]);
}

export async function generateAnswer(system: string, user: string) {
  const model = getEnvGenerationModel();
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.3,
  });
  return completion.choices?.[0]?.message?.content ?? '';
}

function getOpenAIClient() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  if (gatewayKey) {
    return new OpenAI({ apiKey: gatewayKey, baseURL: 'https://ai-gateway.vercel.sh/v1' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY or AI_GATEWAY_API_KEY');
  return new OpenAI({ apiKey });
}
