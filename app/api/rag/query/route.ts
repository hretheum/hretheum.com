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
import { classifyIntent, topIntentCandidates } from '@/lib/intent/classify';
import { rerankWithLLM } from '@/lib/intent/rerank';
import type { IntentId } from '@/lib/intent/intents';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Load index and embed query
    const index = await loadIndex();
    if (!index.vectors || index.vectors.length === 0) {
      return NextResponse.json({
        answer: 'I do not have any indexed data yet. Please add Markdown sources to data/rag/ and run ingestion.',
        citations: [],
      });
    }
    // Query Expansion (2–4 paraphrases based on intent synonyms) + aggregation
    const generateExpansions = (intent: string, msg: string): string[] => {
      const base = msg.trim();
      const extras: string[] = [];
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
      // Limit to 3 expansions to keep cost down
      return [base, ...extras.slice(0, 3)];
    };

    // We need intent for expansion; classify first quickly (will be used again below)
    // But we already do classification further down; do an early classification here to guide expansions
    const earlyIntent = await classifyIntent(message);
    const expansions = generateExpansions(earlyIntent.topIntent, message);

    // Embed each expansion and aggregate similarities by (text + source) key using max score
    const aggScores = new Map<string, { r: ReturnType<typeof rankBySimilarity>[number]; score: number }>();
    for (const qStr of expansions) {
      const vec = await embedQuery(qStr);
      const partial = rankBySimilarity(vec, index.vectors).slice(0, Math.max(getTopK() * 4, 20));
      for (const r of partial) {
        const key = `${r.v.metadata?.source_name || ''}::${r.v.text.slice(0, 64)}`;
        const prev = aggScores.get(key)?.score ?? -Infinity;
        if (r.score > prev) aggScores.set(key, { r, score: r.score });
      }
    }
    const ranked = Array.from(aggScores.values())
      .map((x) => x.r)
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

    // Dynamic thresholding based on top-1 score
    const top1 = boosted[0]?.boosted ?? 0;
    let threshold = baseThreshold;
    let lowConfidence = false;
    if (top1 >= 0.8) {
      threshold = Math.max(baseThreshold, top1 - 0.1);
    } else if (top1 >= 0.65) {
      threshold = Math.max(0.6, baseThreshold - 0.05);
    } else {
      threshold = Math.max(0.5, Math.min(baseThreshold, 0.55));
      lowConfidence = true;
    }

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

    let filtered = boosted.filter((r) => r.boosted >= threshold);
    // Conditional filtering by source_type for certain intents when confidence is low
    if (lowConfidence && (intentId === 'retrieval_core.case_study' || intentId === 'retrieval_core.experience')) {
      const requiredType = intentId === 'retrieval_core.case_study' ? 'case_study' : 'experience';
      const byType = filtered.filter((r) => String(r.v.metadata?.source_type || '').toLowerCase() === requiredType);
      if (byType.length > 0) {
        filtered = byType;
      } else {
        // fallback: widen search within boosted pool by type
        const boostedByType = boosted.filter((r) => String(r.v.metadata?.source_type || '').toLowerCase() === requiredType);
        if (boostedByType.length > 0) {
          filtered = boostedByType;
        }
      }
    }
    let selected = mmrSelect(filtered, topK);
    if (selected.length === 0) {
      // Fallback: take topK regardless of threshold and mark low confidence
      selected = mmrSelect(boosted, topK);
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
      return new Response(rs, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming JSON response (default)
    let answer = await generateAnswer(system, user);
    if (lowConfidence) {
      answer = `${answer}\n\nNote: Confidence is low because few highly similar sources were found. If you want a more precise answer, try a more specific question (e.g., include organization or project name).`;
    }

    // telemetry (normal)
    console.log('[rag.query:intent]', {
      msg: String(message).slice(0, 120),
      intent: intentId,
      confidence: Number(intentRes.confidence.toFixed(3)),
      selectedCount: selected.length,
      top1Boosted: Number(top1.toFixed(3)),
    });
    return NextResponse.json({ answer, citations, intent: { id: intentId, confidence: intentRes.confidence } });
  } catch (err) {
    console.error('RAG query error', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
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
