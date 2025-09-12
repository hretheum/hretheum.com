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

    // Filter by similarity threshold
    const baseThreshold = getSimilarityThreshold();
    const topK = getTopK();

    // Intent detection for boosting
    const intent = detectIntent(message);

    // Apply metadata boosts and compute boosted scores
    const boosted = ranked.map((r) => ({
      ...r,
      boosted: r.score * (1 + computeBoost(r.v.metadata, intent)),
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

    return NextResponse.json({ answer, citations });
  } catch (err) {
    console.error('RAG query error', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- Helpers ---
function detectIntent(q: string) {
  const s = q.toLowerCase();
  return {
    competencies: /competenc|strength|skill|core/i.test(s),
    leadership: /leader|playbook|org|coaching|chapter|tribe/i.test(s),
    experience: /experience|career|role|project|worked|where/i.test(s),
    caseStudy: /case\s*study|outcome|approach|challenge|result/i.test(s),
  };
}

function computeBoost(meta: any, intent: ReturnType<typeof detectIntent>) {
  let boost = 0;
  const st = String(meta?.source_type || '').toLowerCase();
  if (intent.competencies) {
    if (st === 'bio') boost += 0.15;
    if (st === 'leadership') boost += 0.15;
  }
  if (intent.leadership && st === 'leadership') boost += 0.2;
  if (intent.experience && st === 'experience') boost += 0.15;
  if (intent.caseStudy && st === 'case_study') boost += 0.2;

  // Light tech keyword matching boost
  const tech = Array.isArray(meta?.tech) ? meta.tech.map((t: string) => String(t).toLowerCase()) : [];
  if (/design system|design\s*systems/i.test(String(meta?.source_name || '')) || /design system/i.test(String(meta?.source_type || ''))) {
    if (/design system/i.test(intentToString(intent))) boost += 0.05;
  }
  // If question mentions RAG/AI and chunk tagged AI, add small boost
  if (/ai|rag|llm|mcp/i.test(intentToString(intent)) && tech.some((t: string) => /ai|rag|llm|mcp/.test(t))) boost += 0.05;

  return boost;
}

function intentToString(intent: ReturnType<typeof detectIntent>) {
  const keys = Object.entries(intent).filter(([, v]) => v).map(([k]) => k).join(' ');
  return keys;
}
