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
    const threshold = getSimilarityThreshold();
    const topK = getTopK();
    const selected = ranked.filter((r) => r.score >= threshold).slice(0, topK);

    if (selected.length === 0) {
      return NextResponse.json({
        answer: 'I do not have sufficient information in my sources to answer that precisely. Feel free to ask about competencies, experience, leadership approach, or specific case studies.',
        citations: [],
      });
    }

    // Prepare prompt from selected contexts
    const contexts = selected.map((s) => ({ text: s.v.text, metadata: s.v.metadata }));
    const { system, user } = buildAnswerPrompt(message, contexts);
    const answer = await generateAnswer(system, user);

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
