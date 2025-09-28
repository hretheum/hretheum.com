// Simple micro-benchmark for rules engine p95 latency
// Run: npx tsx scripts/rules_bench.ts
import { performance } from 'node:perf_hooks'
import { evaluateRulesGeneric } from '@/lib/rules/engine'
import type { RuleDefinition, RuleContextBase, RuleActionBase } from '@/lib/rules/types'

function percentile(arr: number[], p: number) {
  const a = [...arr].sort((x, y) => x - y)
  const idx = Math.floor((p / 100) * (a.length - 1))
  return a[idx]
}

type Ctx = RuleContextBase & { scope: 'csr'; x: number }
type Act = RuleActionBase & { type: 'noop' }

function makeRules(n: number): RuleDefinition<Ctx, Act>[] {
  const rules: RuleDefinition<Ctx, Act>[] = []
  for (let i = 0; i < n; i++) {
    rules.push({
      id: `r${i}`,
      scope: 'csr',
      priority: i,
      conditions: [
        (ctx) => (ctx.x & 1) === 0,
        (ctx) => ctx.x % 3 !== 0,
      ],
      actions: [() => ({ type: 'noop' })],
    })
  }
  return rules
}

async function main() {
  const rules = makeRules(50)
  const samples = 500
  const times: number[] = []
  for (let i = 0; i < samples; i++) {
    const ctx: Ctx = { scope: 'csr', x: i }
    const t0 = performance.now()
    const out = evaluateRulesGeneric<Ctx, Act>(rules, ctx)
    void out
    const t1 = performance.now()
    times.push(t1 - t0)
  }
  const p50 = percentile(times, 50)
  const p95 = percentile(times, 95)
  const p99 = percentile(times, 99)
  console.log(JSON.stringify({ samples, mean_ms: times.reduce((a,b)=>a+b,0)/times.length, p50, p95, p99 }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
