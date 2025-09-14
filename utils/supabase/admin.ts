// Supabase admin client for Node scripts (service role). Do NOT expose service key client-side.
// Comments in English per project rules.

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'rag-ingest-script' } },
  });
}
