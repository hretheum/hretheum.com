import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// MVP: Ensure local vector store file exists. Later: parse MD, chunk, embed, write full index.
export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const indexPath = path.join(dataDir, 'index.json');

    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {}

    try {
      await fs.access(indexPath);
    } catch {
      await fs.writeFile(indexPath, JSON.stringify({ vectors: [] }, null, 2), 'utf-8');
    }

    return NextResponse.json({ ok: true, index: 'data/index.json' });
  } catch (err) {
    console.error('Ingest error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
