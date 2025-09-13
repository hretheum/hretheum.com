import { NextRequest, NextResponse } from 'next/server';
import {
  buildAnswerPrompt,
  embedQuery,
  getSimilarityThreshold,
  getTopK,
  loadIndex,
  rankBySimilarity,
  generateAnswer,
} from '@/lib/rag';
import { classifyIntent } from '@/lib/intent/classify';

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
    const qVec = await embedQuery(message);
    const ranked = rankBySimilarity(qVec, index.vectors);

    // Intent detection for boosting (embedding-first)
    const intentRes = await classifyIntent(message);
    const intentId = intentRes.topIntent;

    // If low-confidence intent, ask for clarification (Section 18.3)
    if (intentRes.confidence < 0.45) {
      return NextResponse.json({
        answer:
          "I want to make sure I understand. Are you asking about competencies, leadership, experience, or a specific case study?",
        citations: [],
        intent: { id: intentId, confidence: intentRes.confidence },
      });
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

    let selected = boosted.filter((r) => r.boosted >= threshold).slice(0, topK);
    if (selected.length === 0) {
      // Fallback: take topK regardless of threshold and mark low confidence
      selected = boosted.slice(0, topK);
      lowConfidence = true;
    }

    // Prepare prompt from selected contexts
    const contexts = selected.map((s) => ({ text: s.v.text, metadata: s.v.metadata }));
    const { system, user } = buildAnswerPrompt(message, contexts);
    let answer = await generateAnswer(system, user);
    if (lowConfidence) {
      answer = `${answer}\n\nNote: Confidence is low because few highly similar sources were found. If you want a more precise answer, try a more specific question (e.g., include organization or project name).`;
    }

    // Build simple citations from selected chunks (first 200 chars)
    const citations = selected.map((s) => ({
      quote: s.v.text.slice(0, 200) + (s.v.text.length > 200 ? '…' : ''),
      source_name: s.v.metadata?.source_name || 'source',
      link: s.v.metadata?.link || undefined,
    }));

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

  const mentionsDesignSystems = /design system|design\s*systems/.test(msg) || /design system/.test(sourceName) || /design system/.test(sourceType);
  const mentionsAI = /\b(ai|rag|llm|mcp)\b/.test(msg) && tech.some((t: string) => /\b(ai|rag|llm|mcp)\b/.test(t));

  if (mentionsDesignSystems) boost += 0.05;
  if (mentionsAI) boost += 0.05;

  return boost;
}
