// Intent debug API endpoint
// POST { query: string } -> classifyIntent result
// Docs: See docs/CONVERSATIONAL_RAG.md (Section 18.3) and intent playbook

import { NextRequest, NextResponse } from "next/server";
import { classifyIntent } from "@/lib/intent/classify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = (body?.query ?? "").toString();
    if (!query) {
      return NextResponse.json({ error: "Missing 'query'" }, { status: 400 });
    }

    const result = await classifyIntent(query);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Intent detection failed", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
