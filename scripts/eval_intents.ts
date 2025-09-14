// Minimal evaluation script for intent detection
// Usage: npx tsx scripts/eval_intents.ts tests/intent_eval.csv
// CSV format: query,expected_intent

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { classifyIntent } from '@/lib/intent/classify';
import type { IntentId } from '@/lib/intent/intents';

// Lightweight .env loader to avoid dotenv dependency in CI
import { promises as fs } from 'node:fs';
import path from 'node:path';
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (_) {
    // ignore if no .env present
  }
}

function parseCSV(path: string): { query: string; expected: IntentId }[] {
  const raw = readFileSync(path, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const out: { query: string; expected: IntentId }[] = [];
  for (const line of lines) {
    const idx = line.indexOf(',');
    if (idx === -1) continue;
    const query = line.slice(0, idx).trim();
    const expected = line.slice(idx + 1).trim() as IntentId;
    if (!query || !expected) continue;
    out.push({ query, expected });
  }
  return out;
}

function f1(prec: number, rec: number) {
  return (2 * prec * rec) / (prec + rec || 1);
}

async function main() {
  await loadEnvFile();
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: npx tsx scripts/eval_intents.ts tests/intent_eval.csv');
    process.exit(1);
  }
  const rows = parseCSV(resolve(csvPath));
  if (rows.length === 0) {
    console.error('CSV empty or invalid. Expect lines: query,expected_intent');
    process.exit(1);
  }

  const labels = new Set<string>();
  rows.forEach((r) => labels.add(r.expected));

  let correct = 0;
  const tp = new Map<string, number>();
  const fp = new Map<string, number>();
  const fn = new Map<string, number>();
  for (const l of labels) {
    tp.set(l, 0);
    fp.set(l, 0);
    fn.set(l, 0);
  }

  for (const { query, expected } of rows) {
    const res = await classifyIntent(query);
    const pred = res.topIntent as string;
    if (pred === expected) correct++;
    // update counts per expected label
    if (pred === expected) {
      tp.set(expected, (tp.get(expected) || 0) + 1);
    } else {
      fp.set(pred, (fp.get(pred) || 0) + 1);
      fn.set(expected, (fn.get(expected) || 0) + 1);
    }
  }

  const accuracy = correct / rows.length;
  let macroF1 = 0;
  const perIntent: Record<string, { tp: number; fp: number; fn: number; precision: number; recall: number; f1: number }>= {};
  for (const l of labels) {
    const tpi = tp.get(l) || 0;
    const fpi = fp.get(l) || 0;
    const fni = fn.get(l) || 0;
    const p = tpi / Math.max(1, tpi + fpi);
    const r = tpi / Math.max(1, tpi + fni);
    const fi = f1(p, r);
    macroF1 += fi;
    perIntent[l] = { tp: tpi, fp: fpi, fn: fni, precision: p, recall: r, f1: fi };
  }
  macroF1 /= labels.size || 1;

  console.log(JSON.stringify({ total: rows.length, correct, accuracy, macroF1 }, null, 2));

  // Diagnostics: per-intent metrics sorted by F1 asc
  const sortedDiag = Object.entries(perIntent)
    .sort((a, b) => a[1].f1 - b[1].f1)
    .map(([k, v]) => ({ intent: k, ...v }));
  console.log("\nPer-intent metrics (lowest F1 first):\n", JSON.stringify(sortedDiag, null, 2));

  // Optionally list top confusions (predicted -> expected counts)
  // To keep it lightweight, recompute quickly
  const conf: Record<string, Record<string, number>> = {};
  for (const { query, expected } of rows) {
    const res = await classifyIntent(query);
    const pred = res.topIntent as string;
    if (pred !== expected) {
      conf[pred] = conf[pred] || {};
      conf[pred][expected] = (conf[pred][expected] || 0) + 1;
    }
  }
  const confList: Array<{ pred: string; expected: string; count: number }> = [];
  for (const p of Object.keys(conf)) {
    for (const e of Object.keys(conf[p])) {
      confList.push({ pred: p, expected: e, count: conf[p][e] });
    }
  }
  confList.sort((a, b) => b.count - a.count);
  console.log("\nTop confusions (pred -> expected):\n", JSON.stringify(confList.slice(0, 15), null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
