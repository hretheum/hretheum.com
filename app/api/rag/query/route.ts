import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  buildAnswerPrompt,
  embedQuery,
  getSimilarityThreshold,
  getTopK,
  loadIndex,
  rankBySimilarity,
  generateAnswer,
} from '@/lib/rag';
import { searchByEmbedding } from '@/lib/rag_store/supabase';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { classifyIntent, topIntentCandidates } from '@/lib/intent/classify';
import { rerankWithLLM } from '@/lib/intent/rerank';
import type { IntentId } from '@/lib/intent/intents';

export async function POST(req: NextRequest) {
  try {
    const tStart = Date.now();
    const timings: Record<string, number> = {};
    const mark = (label: string, t0: number) => {
      timings[label] = (timings[label] || 0) + (Date.now() - t0);
    };
    const { message } = await req.json();

    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Load index only in JSON mode (fallback). Supabase mode queries remotely.
    const useSupabase = process.env.RAG_STORE === 'supabase';
    const index = useSupabase ? null : await loadIndex();
    if (!useSupabase) {
      if (!index!.vectors || index!.vectors.length === 0) {
        return NextResponse.json({
          answer: 'I do not have any indexed data yet. Please add Markdown sources to data/rag/ and run ingestion.',
          citations: [],
        });
      }
    }
    // Query Expansion (2–4 paraphrases based on intent synonyms) + aggregation
    const generateExpansions = (intent: string, msg: string): string[] => {
      const base = msg.trim();
      const extras: string[] = [];
      const mlow = base.toLowerCase();
      const mentionsFinance = /(finans|bank|ubezpiecze|insurtech|fintech)/.test(mlow);
      switch (intent) {
        case 'retrieval_core.competencies':
          extras.push(`${base} competencies`, `${base} skills verification`, `usability heuristics ${base}`);
          break;
        case 'retrieval_core.leadership':
          extras.push(`${base} leadership style`, `${base} coaching mentoring`, `org design ${base}`);
          break;
        case 'retrieval_core.experience':
          extras.push(`${base} past roles`, `${base} responsibilities`, `projects ${base}`);
          break;
        case 'retrieval_core.case_study':
          extras.push(`${base} case study`, `${base} outcomes`, `approach challenges results ${base}`);
          break;
        case 'retrieval_core.product_sense':
          extras.push(`${base} mvp tradeoffs`, `${base} value proposition`, `retention activation ${base}`);
          break;
        case 'retrieval_core.research_process':
          extras.push(`${base} research plan`, `${base} avoid bias`, `insights backlog ${base}`);
          break;
        case 'retrieval_core.design_systems':
          extras.push(`${base} design tokens`, `${base} storybook`, `governance ${base}`);
          break;
        case 'retrieval_core.metrics_experiments':
          extras.push(`${base} ab test`, `${base} metrics roi`, `experiments power bias ${base}`);
          break;
        case 'retrieval_core.stakeholder_mgmt':
          extras.push(`${base} stakeholder alignment`, `${base} risk communication`, `escalation ${base}`);
          break;
        case 'retrieval_core.tools_automation':
          extras.push(`${base} figma`, `${base} design ops automation`, `notion confluence ${base}`);
          break;
        default:
          break;
      }
      // Finance-specific alias expansions to bias retrieval towards banks/insurers when the query is broad
      if (mentionsFinance) {
        extras.push(
          `${base} ING`,
          `${base} PKO`,
          `${base} Warta`,
          `${base} Bank BPH`,
          `${base} BPH`
        );
      }
      // Limit to 3 expansions to keep cost down
      return [base, ...extras.slice(0, 3)];
    };

    // We need intent for expansion; classify first quickly (will be used again below)
    // But we already do classification further down; do an early classification here to guide expansions
    const earlyIntent = await classifyIntent(message);
    let expansions = generateExpansions(earlyIntent.topIntent, message);

    // PRF (pseudo-relevance feedback) when Supabase is enabled: take top lexical terms and extend expansions
    if (useSupabase) {
      try {
        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false } }
        );
        // Use hybrid with empty embedding to get lexical-only seeds quickly
        // We pass a zero vector and rely on ts_rank; embedding threshold makes vec_score negligible
        const zero = new Array(1536).fill(0);
        const t0 = Date.now();
        const { data, error } = await supabase.rpc('match_chunks_hybrid', {
          query_text: message,
          query_embedding: zero as any,
          match_count: 20,
          similarity_threshold: 1.1, // ignore vec matches
        });
        mark('prf_seed_ms', t0);
        if (!error && Array.isArray(data) && data.length > 0) {
          // naive PRF: extract top frequent tokens from returned texts
          const freq = new Map<string, number>();
          for (const r of data as any[]) {
            const toks = String(r.text || '')
              .toLowerCase()
              .split(/[^a-z0-9ąęśćżźółń]+/)
              .filter((t) => t && t.length >= 3);
            for (const t of toks) freq.set(t, (freq.get(t) || 0) + 1);
          }
          const stop = new Set<string>(['the','and','or','not','for','with','you','your','are','have','has','this','that','from','about','into','over','under','into','how','what','when','which','why','use','used','using','case','study','project','projekt','case study']);
          const topTerms = Array.from(freq.entries())
            .filter(([t]) => !stop.has(t))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([t]) => t);
          if (topTerms.length) {
            expansions = [expansions[0], ...topTerms.map((t) => `${message} ${t}`), ...expansions.slice(1)].slice(0, 4);
          }
        }
      } catch {}
    }

    // Aggregate via hybrid RPC when Supabase, otherwise via JSON index
    const aggScores = new Map<string, { v: { text: string; metadata: Record<string, any> }; score: number }>();
    for (const qStr of expansions) {
      if (useSupabase) {
        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false } }
        );
        let rows: any[] = [];
        try {
          const tEmb0 = Date.now();
          const vec = await embedQuery(qStr);
          mark('embed_ms', tEmb0);
          const tRpc0 = Date.now();
          const { data, error } = await supabase.rpc('match_chunks_hybrid_two_stage', {
            query_text: qStr,
            query_embedding: vec as any,
            vec_k: 200,
            match_count: Math.max(getTopK() * 6, 40),
            similarity_threshold: 0.0,
          });
          mark('hybrid_rpc_ms', tRpc0);
          rows = (!error && Array.isArray(data)) ? (data as any[]) : [];
          if (error) console.warn('[rag.query:rpc_error]', error.message || error);
        } catch (embErr: any) {
          console.warn('[rag.query:embed_fallback]', embErr?.message || embErr);
          // Lexical-only fallback using hybrid (ignore vector by raising threshold)
          const zero = new Array(1536).fill(0);
          const tRpc0 = Date.now();
          const { data, error } = await supabase.rpc('match_chunks_hybrid', {
            query_text: qStr,
            query_embedding: zero as any,
            match_count: Math.max(getTopK() * 6, 40),
            similarity_threshold: 1.1,
          });
          mark('hybrid_rpc_ms', tRpc0);
          rows = (!error && Array.isArray(data)) ? (data as any[]) : [];
          if (error) console.warn('[rag.query:rpc_error_fallback]', error.message || error);
        }
        for (const r of rows) {
          const key = `${r.source_name || ''}::${String(r.text).slice(0, 64)}`;
          const prev = aggScores.get(key)?.score ?? -Infinity;
          const score = Number(r.score ?? 0);
          if (score > prev) aggScores.set(key, { v: { text: r.text, metadata: {
            document_id: r.document_id,
            file: r.file,
            source_name: r.source_name,
            source_type: r.source_type,
            role: r.role,
            tech: r.tech,
            org: r.org,
            product: r.product,
            domain: r.domain,
            kpis: r.kpis,
            aliases: r.aliases,
            link: r.link,
            date: r.date,
          } }, score });
        }
      } else {
        const vec = await embedQuery(qStr);
        const partial = rankBySimilarity(vec, index!.vectors).slice(0, Math.max(getTopK() * 6, 40));
        for (const r of partial) {
          const key = `${r.v.metadata?.source_name || ''}::${r.v.text.slice(0, 64)}`;
          const prev = aggScores.get(key)?.score ?? -Infinity;
          if (r.score > prev) aggScores.set(key, { v: { text: r.v.text, metadata: r.v.metadata }, score: r.score });
        }
      }
    }
    const ranked = Array.from(aggScores.values())
      .map((x) => ({ v: x.v, score: x.score }))
      .sort((a, b) => b.score - a.score);

    // Intent detection for boosting (embedding-first)
    const intentRes = await classifyIntent(message);
    let intentId = intentRes.topIntent;

    // If low-confidence intent, ask for clarification (Section 18.3)
    if (intentRes.confidence < 0.45) {
      // telemetry (low-confidence)
      console.log('[rag.query:intent]', {
        msg: String(message).slice(0, 120),
        intent: intentId,
        confidence: Number(intentRes.confidence.toFixed(3)),
        note: 'low-confidence',
      });
      return NextResponse.json({
        answer:
          "I want to make sure I understand. Are you asking about competencies, leadership, experience, or a specific case study?",
        citations: [],
        intent: { id: intentId, confidence: intentRes.confidence },
      });
    }

    // Try LLM rerank if top-2 candidates are close (delta < 10%)
    try {
      const candidates = await topIntentCandidates(message, { kDocs: 8, maxIntents: 2 });
      if (candidates.length === 2) {
        const [a, b] = candidates;
        if (a.score > 0 && (a.score - b.score) / a.score < 0.10) {
          const adjudication = await rerankWithLLM(message, candidates);
          if (isIntentId(adjudication?.final_intent)) {
            intentId = adjudication.final_intent;
          }
        }
      }
    } catch (_) {
      // best-effort rerank; ignore errors
    }

    // Filter by similarity threshold
    const baseThreshold = getSimilarityThreshold();
    const topK = getTopK();

    // Apply metadata boosts per Retrieval Playbook and compute boosted scores
    const boosted = ranked.map((r) => ({
      ...r,
      boosted: r.score * (1 + computeBoost(r.v.metadata, intentId, message)),
    }));
    boosted.sort((a, b) => b.boosted - a.boosted);

    // Widen-then-prune: skip hard threshold, start from a broad pool, prune later by MMR and token budget
    const top1 = boosted[0]?.boosted ?? 0;
    let lowConfidence = top1 < 0.55;

    // Simple MMR to reduce redundancy based on token overlap
    const mmrSelect = (cands: typeof boosted, k: number): typeof boosted => {
      const sel: typeof boosted = [];
      const tokens = (s: string) => new Set(String(s).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
      while (sel.length < k && cands.length > 0) {
        const cand = cands.shift()!;
        // compute max overlap with already selected
        const tCand = tokens(cand.v.text);
        let maxOverlap = 0;
        for (const s of sel) {
          const tSel = tokens(s.v.text);
          const inter = [...tCand].filter((t) => tSel.has(t)).length;
          const union = new Set([...tCand, ...tSel]).size || 1;
          const jacc = inter / union;
          if (jacc > maxOverlap) maxOverlap = jacc;
        }
        // apply small diversity penalty threshold
        if (maxOverlap < 0.5) sel.push(cand);
      }
      // backfill if we selected too few (highly repetitive corpus)
      if (sel.length < k) sel.push(...cands.slice(0, k - sel.length));
      return sel;
    };

    // Broad candidate pool (adaptive size)
    const poolSize = Math.min(boosted.length, Math.max(getTopK() * 8, 60));
    let filtered = boosted.slice(0, poolSize);
    // Conditional filtering by source_type for certain intents when confidence is low
    if (lowConfidence && (intentId === 'retrieval_core.case_study' || intentId === 'retrieval_core.experience')) {
      const requiredType = intentId === 'retrieval_core.case_study' ? 'case_study' : 'experience';
      const byType = filtered.filter((r) => String(r.v.metadata?.source_type || '').toLowerCase() === requiredType);
      if (byType.length > 0) {
        filtered = byType;
      } else {
        // fallback: widen search within boosted pool by type
        const boostedByType = boosted.filter((r) => String(r.v.metadata?.source_type || '').toLowerCase() === requiredType).slice(0, poolSize);
        if (boostedByType.length > 0) {
          filtered = boostedByType;
        }
      }
    }
    // Token-budgeted selection: increase K until answer context ~ within budget
    const estimateTokens = (s: string) => Math.ceil(s.length / 4);
    const tokenBudget = 2200; // fits safely into prompt window
    let kTry = Math.min(3, filtered.length);
    const tSel0 = Date.now();
    let selected = mmrSelect(filtered.slice(), kTry);
    let totalTokens = selected.reduce((acc, it) => acc + estimateTokens(it.v.text), 0);
    while (kTry < Math.min(12, filtered.length) && totalTokens < tokenBudget) {
      kTry += 1;
      selected = mmrSelect(filtered.slice(), kTry);
      totalTokens = selected.reduce((acc, it) => acc + estimateTokens(it.v.text), 0);
      if (totalTokens > tokenBudget) {
        // step back one to stay within budget
        kTry -= 1;
        selected = mmrSelect(filtered.slice(), kTry);
        break;
      }
    }
    mark('selection_mmr_ms', tSel0);
    if (selected.length === 0) {
      // Fallback: take topK regardless of threshold and mark low confidence
      const fbSize = Math.min(10, Math.max(getTopK(), boosted.length));
      selected = mmrSelect(boosted.slice(0, fbSize), Math.min(5, fbSize));
      lowConfidence = true;
    }

    // Prepare prompt from selected contexts
    const contexts = selected.map((s) => ({ text: s.v.text, metadata: s.v.metadata }));
    const { system, user } = buildAnswerPrompt(message, contexts);

    // Build simple citations from selected chunks (first 200 chars)
    const citations = selected.map((s) => ({
      quote: s.v.text.slice(0, 200) + (s.v.text.length > 200 ? '…' : ''),
      source_name: s.v.metadata?.source_name || 'source',
      link: s.v.metadata?.link || undefined,
    }));

    // If SSE streaming requested, stream tokens
    const url = new URL(req.url);
    const wantsSSE = url.searchParams.get('stream') === '1' || (req.headers.get('accept') || '').includes('text/event-stream');
    if (wantsSSE) {
      const client = getOpenAIClientLocal();
      const model = process.env.AI_MODEL_GENERATION || 'gpt-4o-mini';
      const stream = await client.chat.completions.create({
        model,
        stream: true,
        temperature: 0.3,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const encoder = new TextEncoder();
      const rs = new ReadableStream<Uint8Array>({
        start(controller) {
          (async () => {
            for await (const part of stream) {
              const token = part.choices?.[0]?.delta?.content || '';
              if (token) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', token })}\n\n`));
              }
            }
            // final meta
            const meta = { type: 'done', citations, intent: { id: intentId, confidence: intentRes.confidence }, lowConfidence };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(meta)}\n\n`));
            controller.close();
          })().catch((err) => controller.error(err));
        },
      });
      // telemetry (normal)
      console.log('[rag.query:intent]', {
        msg: String(message).slice(0, 120),
        intent: intentId,
        confidence: Number(intentRes.confidence.toFixed(3)),
        selectedCount: selected.length,
        top1Boosted: Number(top1.toFixed(3)),
      });
      // telemetry (timings) for SSE path
      console.log('[rag.query:telemetry]', {
        msg: String(message).slice(0, 120),
        timings,
        total_ms: Date.now() - tStart,
        pool_size: filtered.length,
      });
      return new Response(rs, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Non-SSE: generate full answer and return JSON
      const tGen0 = Date.now();
      const answer = await generateAnswer(system, user);
      mark('llm_answer_ms', tGen0);
      // telemetry
      console.log('[rag.query:intent]', {
        msg: String(message).slice(0, 120),
        intent: intentId,
        confidence: Number(intentRes.confidence.toFixed(3)),
        selectedCount: selected.length,
        top1Boosted: Number(top1.toFixed(3)),
      });
      console.log('[rag.query:telemetry]', {
        msg: String(message).slice(0, 120),
        timings,
        total_ms: Date.now() - tStart,
        pool_size: filtered.length,
      });
      return NextResponse.json({ answer, citations, intent: { id: intentId, confidence: intentRes.confidence } });
    }
  } catch (err: any) {
    console.error('[rag.query:error]', err?.message || err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

// --- Helpers ---
function isIntentId(v: any): v is IntentId {
  const allowed: Set<string> = new Set([
    'retrieval_core.competencies',
    'retrieval_core.leadership',
    'retrieval_core.experience',
    'retrieval_core.case_study',
    'retrieval_core.product_sense',
    'retrieval_core.research_process',
    'retrieval_core.design_systems',
    'retrieval_core.metrics_experiments',
    'retrieval_core.stakeholder_mgmt',
    'retrieval_core.tools_automation',
    'role_fit.skill_verification',
    'role_fit.domain_expertise',
    'role_fit.fit_assessment',
    'role_fit.behavioral',
    'logistics.availability',
    'logistics.location_remote',
    'logistics.compensation',
    'logistics.scheduling',
    'logistics.visa_relocation_travel',
    'process.hiring_process',
    'process.assignment_brief',
    'assets.assets_request',
    'assets.code_or_design_files',
    'compliance.nda_privacy',
    'compliance.data_processing_ip',
    'compliance.accessibility_compliance',
    'conversational.clarification',
    'conversational.smalltalk',
    'conversational.rapport_meta',
    'conversational.curveballs_creative',
  ]);
  return typeof v === 'string' && allowed.has(v);
}
function computeBoost(meta: any, intentId: string, userMessage: string) {
  let boost = 0;
  const st = String(meta?.source_type || '').toLowerCase();

  // Intent-Based Boosts (Retrieval Playbook)
  switch (intentId) {
    case 'retrieval_core.competencies':
      if (st === 'bio') boost += 0.15;
      if (st === 'leadership') boost += 0.15;
      break;
    case 'retrieval_core.leadership':
      if (st === 'leadership') boost += 0.2;
      break;
    case 'retrieval_core.experience':
      if (st === 'experience') boost += 0.15;
      break;
    case 'retrieval_core.case_study':
      if (st === 'case_study') boost += 0.2;
      break;
    default:
      // non-retrieval intents: no metadata boost
      break;
  }

  // Optional keyword boosts
  const msg = String(userMessage || '').toLowerCase();
  const tech = Array.isArray(meta?.tech) ? meta.tech.map((t: string) => String(t).toLowerCase()) : [];
  const sourceName = String(meta?.source_name || '').toLowerCase();
  const sourceType = String(meta?.source_type || '').toLowerCase();
  const org = String(meta?.org || '').toLowerCase();
  const product = String(meta?.product || '').toLowerCase();
  const domain = String(meta?.domain || '').toLowerCase();
  const kpis: string[] = Array.isArray(meta?.kpis) ? meta.kpis.map((x: string) => String(x).toLowerCase()) : [];
  const aliases: string[] = Array.isArray(meta?.aliases) ? meta.aliases.map((x: string) => String(x).toLowerCase()) : [];

  const mentionsDesignSystems = /design system|design\s*systems/.test(msg) || /design system/.test(sourceName) || /design system/.test(sourceType);
  const mentionsAI = /\b(ai|rag|llm|mcp)\b/.test(msg) && tech.some((t: string) => /\b(ai|rag|llm|mcp)\b/.test(t));

  if (mentionsDesignSystems) boost += 0.05;
  if (mentionsAI) boost += 0.05;

  // Entity boost: overlap between user message tokens and source_name
  if (sourceName) {
    const stop = new Set([
      'the','and','or','a','an','to','of','for','on','in','with','about','from','by','at','as','is','are','be','this','that','it','how','what','when','which','why','do','does','did','you','your','my'
    ]);
    const msgTokens = Array.from(new Set(msg.split(/[^a-z0-9]+/).filter(t => t.length >= 3 && !stop.has(t))));
    let hits = 0;
    for (const t of msgTokens) {
      if (sourceName.includes(t)) hits++;
    }
    if (hits > 0) {
      // up to +0.15 boost for strong entity overlap
      boost += Math.min(0.15, 0.03 * hits);
    }
  }

  return boost;
}

// Local OpenAI client for SSE streaming path (mirrors lib/rag.ts gateway logic)
function getOpenAIClientLocal() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  if (gatewayKey) {
    return new OpenAI({ apiKey: gatewayKey, baseURL: 'https://ai-gateway.vercel.sh/v1' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY or AI_GATEWAY_API_KEY');
  return new OpenAI({ apiKey });
}
