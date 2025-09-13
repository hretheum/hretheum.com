// Embedding-first intent classifier
// References: docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md (section 2.4)

import { buildStore } from "./vectorStore";
import type { IntentResult, IntentId, RoutingRules } from "./intents";

const DEFAULT_PRIORITY: IntentId[] = [
  "compliance.nda_privacy",
  "process.assignment_brief",
  "assets.assets_request",
  "logistics.compensation",
];

function hardBlockRule(q: string): IntentId | null {
  const s = q.toLowerCase();
  if (s.includes("nda") || s.includes("pouf") || s.includes("confidential")) {
    return "compliance.nda_privacy";
  }
  return null;
}

export async function classifyIntent(
  query: string,
  opts?: { k?: number; threshold?: number; routing?: RoutingRules }
): Promise<IntentResult> {
  const store = await buildStore();
  const k = opts?.k ?? 6;
  const threshold = opts?.threshold ?? 0.45;
  const routing = opts?.routing ?? { hardBlock: hardBlockRule, priority: DEFAULT_PRIORITY };

  // 1) hard routing
  const hard = routing.hardBlock?.(query);
  if (hard) {
    return { topIntent: hard, confidence: 1.0, matches: [{ intent: hard, score: 1, text: query }] };
  }

  // 2) vector similarity
  const results = await store.similaritySearchWithScore(query, k);
  const byIntent = new Map<IntentId, number>();
  const evidence: { intent: IntentId; score: number; text: string }[] = [];

  for (const [doc, raw] of results) {
    const sim = normalizeScore(raw);
    const intent = doc.metadata.intent as IntentId;
    byIntent.set(intent, (byIntent.get(intent) ?? 0) + sim);
    evidence.push({ intent, score: sim, text: doc.pageContent });
  }

  // pick best with priority tie‑break
  const ranked = Array.from(byIntent.entries()).sort((a, b) => b[1] - a[1]);
  let [topIntent, topScore] = ranked[0] ?? [("conversational.clarification" as IntentId), 0];

  if (routing.priority && ranked.length > 1) {
    const order = new Map(routing.priority.map((id, i) => [id, i] as const));
    ranked.sort((a, b) => {
      if (Math.abs(a[1] - b[1]) > 1e-6) return b[1] - a[1];
      return (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999);
    });
    [topIntent, topScore] = ranked[0];
  }

  // threshold / fallback
  if (topScore < threshold) {
    topIntent = "conversational.clarification";
  }

  return { topIntent, confidence: Math.min(1, topScore), matches: evidence.slice(0, k) };
}

// Return top-N intent candidates with aggregated scores, for optional LLM reranking
export async function topIntentCandidates(
  query: string,
  opts?: { kDocs?: number; maxIntents?: number; routing?: RoutingRules }
): Promise<{ id: IntentId; score: number }[]> {
  const store = await buildStore();
  const kDocs = opts?.kDocs ?? 8;
  const results = await store.similaritySearchWithScore(query, kDocs);
  const byIntent = new Map<IntentId, number>();

  for (const [doc, raw] of results) {
    const sim = normalizeScore(raw);
    const intent = doc.metadata.intent as IntentId;
    byIntent.set(intent, (byIntent.get(intent) ?? 0) + sim);
  }

  const ranked = Array.from(byIntent.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, opts?.maxIntents ?? 2);
}

// Normalize vectorstore returned score to a similarity in [0,1]
function normalizeScore(raw: number): number {
  // Case 1: cosine similarity in [-1, 1] (e.g., MemoryVectorStore)
  if (raw >= -1 && raw <= 1) return (raw + 1) / 2;
  // Case 2: distance in [0, 2] (cosine distance) → similarity ~ 1 - d (clamped)
  if (raw >= 0 && raw <= 2) return Math.max(0, Math.min(1, 1 - raw));
  // Fallback: generic monotonic transform
  return 1 / (1 + Math.max(0, raw));
}
