// Minimal evaluation script for intent detection
import 'dotenv/config';
// Usage: npx tsx scripts/eval_intents.ts tests/intent_eval.csv
// CSV format: query,expected_intent

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { classifyIntent } from '@/lib/intent/classify';
import type { IntentId } from '@/lib/intent/intents';

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
  for (const l of labels) {
    const p = (tp.get(l) || 0) / Math.max(1, (tp.get(l) || 0) + (fp.get(l) || 0));
    const r = (tp.get(l) || 0) / Math.max(1, (tp.get(l) || 0) + (fn.get(l) || 0));
    macroF1 += f1(p, r);
  }
  macroF1 /= labels.size || 1;

  console.log(JSON.stringify({ total: rows.length, correct, accuracy, macroF1 }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
