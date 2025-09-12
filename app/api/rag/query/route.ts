import { NextRequest, NextResponse } from 'next/server';

// Minimal, safe MVP: returns a placeholder answer structure.
// TODO: Integrate embeddings + retrieval from data/index.json
// TODO: Call generation model via Vercel AI Gateway (cheap default) using env aliases

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Placeholder response until retrieval is wired
    const answer = `I currently do not have enough indexed data to answer precisely. Please add Markdown sources to data/rag/ and run ingestion. Meanwhile, you can ask about leadership, competencies, or case studies.`;

    return NextResponse.json({
      answer,
      citations: [] as Array<{ quote: string; source_name: string; link?: string }>,
    });
  } catch (err) {
    console.error('RAG query error', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
