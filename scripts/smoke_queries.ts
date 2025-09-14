// Smoke queries script
// Run with: npx tsx scripts/smoke_queries.ts
// This script sends a small suite of queries to the local RAG endpoint and prints simple metrics.

/*
Documentation (English):
- This is a basic smoke test runner for the conversational RAG endpoint.
- It exercises several query categories (finance, media, tools, process, leadership) and reports:
  - HTTP status
  - latency (ms)
  - intent id and confidence
  - number of citations returned
- The endpoint should be running locally at http://localhost:3000.
- The API returns JSON when `stream=0` or omitted.
*/

const ENDPOINT = process.env.SMOKE_ENDPOINT || 'http://localhost:3000/api/rag/query?stream=0';

const QUERIES: string[] = [
  'jakie masz doświadczenie w usługach finansowych',
  'jakie masz doświadczenie w pracy dla mediów',
  'jakich narzędzi używałeś (Figma, Storybook)',
  'jak prowadzisz discovery / proces warsztatowy',
  'leadership/mentoring – przykłady',
  'opowiedz o wybranym case study i rezultatach',
];

async function runOne(q: string) {
  const t0 = Date.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: q }),
  });
  const dt = Date.now() - t0;
  let json: any = null;
  try {
    json = await res.json();
  } catch (e) {}
  const status = res.status;
  const intent = json?.intent?.id || 'n/a';
  const conf = typeof json?.intent?.confidence === 'number' ? Number(json.intent.confidence).toFixed(3) : 'n/a';
  const citations = Array.isArray(json?.citations) ? json.citations.length : 0;
  return { status, dt, intent, conf, citations };
}

async function main() {
  console.log('Smoke: endpoint =', ENDPOINT);
  const results: Array<{ q: string; status: number; dt: number; intent: string; conf: string | number; citations: number }>
    = [];
  for (const q of QUERIES) {
    try {
      const r = await runOne(q);
      results.push({ q, ...r });
      console.log(`- [${r.status}] ${r.dt}ms | intent=${r.intent} (${r.conf}) | citations=${r.citations} | ${q}`);
    } catch (err: any) {
      console.error(`- [ERR] ${q}:`, err?.message || err);
    }
  }
  // Summary
  const ok = results.filter(r => r.status === 200).length;
  const p95 = (() => {
    const arr = results.map(r => r.dt).sort((a, b) => a - b);
    if (arr.length === 0) return 0;
    const idx = Math.floor(arr.length * 0.95) - 1;
    return arr[Math.max(0, Math.min(arr.length - 1, idx))];
  })();
  console.log('\nSummary:');
  console.log(`- Passed: ${ok}/${results.length}`);
  console.log(`- p95 latency: ${p95}ms`);
  const avgCitations = results.length ? (results.reduce((s, r) => s + r.citations, 0) / results.length).toFixed(2) : '0.00';
  console.log(`- avg citations: ${avgCitations}`);
}

main().catch((e) => {
  console.error('Smoke failed:', e);
  process.exit(1);
});
