// All comments/docstrings in English per policy.
import type {
  EvaluateOptions,
  RuleActionBase,
  RuleActionResult,
  RuleCondition,
  RuleContextBase,
  RuleDefinition,
  RuleEvaluationOutcome,
} from './types'

/** Default priority used when a rule doesn't specify one. Lower number runs earlier. */
const DEFAULT_PRIORITY = 100

/** Generic evaluation pipeline used by all scopes. */
export function evaluateRulesGeneric<C extends RuleContextBase, A extends RuleActionBase>(
  rules: RuleDefinition<C, A>[],
  context: C,
  opts: EvaluateOptions<C, A> = {},
): RuleEvaluationOutcome<A> {
  const start = (opts.now || Date.now)()
  const debug = opts.debug || context.debug
  const debugLog: string[] = []

  const sorted = [...rules].sort((a, b) => (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY))
  const results: RuleActionResult<A>[] = []
  let evaluated = 0
  let matched = 0

  for (const rule of sorted) {
    if (opts.maxActions && results.length >= opts.maxActions) break
    evaluated++

    const allTrue = (rule.conditions || []).every((cond: RuleCondition<C>) => {
      try {
        return !!cond(context)
      } catch (e) {
        if (debug) debugLog.push(`[cond-error] ${rule.id}: ${(e as Error).message}`)
        return false
      }
    })

    if (!allTrue) {
      if (debug) debugLog.push(`[skip] ${rule.id}`)
      continue
    }

    matched++
    if (debug) debugLog.push(`[match] ${rule.id}`)

    for (const factory of rule.actions || []) {
      try {
        const action = factory(context)
        if (!action) continue
        const res: RuleActionResult<A> = { ruleId: rule.id, scope: context.scope, action }
        results.push(res)
        if (opts.onAction) opts.onAction(res, context)
        if (opts.maxActions && results.length >= opts.maxActions) break
      } catch (e) {
        if (debug) debugLog.push(`[action-error] ${rule.id}: ${(e as Error).message}`)
      }
    }
  }

  const durationMs = (opts.now || Date.now)() - start
  const outcome: RuleEvaluationOutcome<A> = {
    actions: results,
    metrics: { evaluated, matched, actions: results.length, durationMs },
    debugLog: debug ? debugLog : undefined,
  }
  // Optional telemetry (gated via env)
  try {
    const enabled = String(process.env.RULES_TELEMETRY_ENABLED || 'false').toLowerCase() === 'true'
    const sample = Number(process.env.RULES_TELEMETRY_SAMPLE_RATE || '1')
    // Clamp to [0,1]; NaN → default 1
    const rate = Number.isFinite(sample) ? Math.max(0, Math.min(sample, 1)) : 1
    if (enabled && Math.random() < rate) {
      // Keep this light; consumers may collect logs server-side or in dev tools
      // Do not include PII; only metrics and scope
      // eslint-disable-next-line no-console
      console.log('[rules.eval]', {
        scope: context.scope,
        metrics: outcome.metrics,
      })
    }
  } catch {}
  return outcome
}
