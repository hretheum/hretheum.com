// Supabase-backed RAG store (pgvector). Provides search and upsert.
// Comments/documentation in English per project rules.

import { createAdminClient } from '@/utils/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export type StoreChunk = {
  file: string;
  source_name?: string;
  source_type?: string;
  role?: string;
  tech?: string[];
  org?: string;
  product?: string;
  domain?: string;
  kpis?: string[];
  aliases?: string[];
  link?: string;
  date?: string; // yyyy-mm-dd
  chunk_index: number;
  text: string;
  embedding: number[];
};

export type SearchResult = {
  score: number; // cosine similarity in [0..1]
  text: string;
  metadata: Record<string, any>;
};

function requireAdmin(): SupabaseClient {
  return createAdminClient();
}

/**
 * Parse embedding from Supabase response
 * Phase 2: Handle both array and string formats for backward compatibility
 * 
 * @param emb - Embedding from Supabase (array or JSON string)
 * @returns Parsed embedding as number array, or null if invalid
 */
function parseEmbedding(emb: any): number[] | null {
  // Already an array - return as-is
  if (Array.isArray(emb)) {
    return emb;
  }
  
  // String format - parse JSON
  if (typeof emb === 'string') {
    try {
      const parsed = JSON.parse(emb);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      console.warn('[parseEmbedding] Parsed value is not an array:', typeof parsed);
      return null;
    } catch (error) {
      console.error('[parseEmbedding] Failed to parse embedding:', error);
      return null;
    }
  }
  
  // Invalid format
  console.warn('[parseEmbedding] Embedding is neither array nor string:', typeof emb);
  return null;
}

export async function upsertChunks(chunks: StoreChunk[]) {
  const supabase = requireAdmin();

  // Upsert documents grouped by file to get IDs
  const byFile = new Map<string, StoreChunk[]>();
  for (const c of chunks) {
    if (!byFile.has(c.file)) byFile.set(c.file, []);
    byFile.get(c.file)!.push(c);
  }

  const docIdByFile = new Map<string, string>();
  for (const [file, arr] of byFile) {
    const any = arr[0];
    const { data: docRows, error: docErr } = await supabase
      .from('documents')
      .upsert(
        [
          {
            file,
            source_name: any.source_name ?? null,
            source_type: any.source_type ?? null,
            role: any.role ?? null,
            tech: any.tech ?? null,
            org: any.org ?? null,
            product: any.product ?? null,
            domain: any.domain ?? null,
            kpis: any.kpis ?? null,
            aliases: any.aliases ?? null,
            link: any.link ?? null,
            date: any.date ?? null,
          },
        ],
        { onConflict: 'file' }
      )
      .select('id')
      .single();
    if (docErr) throw docErr;
    docIdByFile.set(file, docRows!.id);

    // Clean existing chunks for file (simplest approach)
    await supabase.from('chunks').delete().eq('document_id', docRows!.id);

    // Insert chunks for this file
    // Phase 2: Validate embedding format before insert
    const rows = arr.map((c) => {
      // Ensure embedding is array (parseEmbedding handles both formats)
      const embedding = parseEmbedding(c.embedding);
      if (!embedding) {
        throw new Error(`Invalid embedding for chunk ${c.chunk_index} in file ${file}`);
      }
      
      return {
        document_id: docRows!.id,
        chunk_index: c.chunk_index,
        text: c.text,
        embedding: embedding as unknown as any, // pgvector accepts float[] via PostgREST
      };
    });
    const { error: chErr } = await supabase.from('chunks').insert(rows);
    if (chErr) throw chErr;
  }
}

export async function searchByEmbedding(vec: number[], k: number, threshold: number): Promise<SearchResult[]> {
  const supabase = requireAdmin();
  // Use RPC: match_chunks(query_embedding, match_count, similarity_threshold)
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: vec as unknown as any,
    match_count: k,
    similarity_threshold: threshold,
  });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    score: Number(r.score ?? 0),
    text: String(r.text ?? ''),
    metadata: {
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
    },
  }));
}
