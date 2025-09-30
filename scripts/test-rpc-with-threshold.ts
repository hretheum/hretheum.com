import { createAdminClient } from '../utils/supabase/admin'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const test = async () => {
  const supabase = createAdminClient()
  const testVector = new Array(1536).fill(0).map(() => Math.random())
  
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: testVector as any,
    match_count: 5,
    similarity_threshold: 0.0,
  })
  
  if (error) {
    console.log('Error:', error.message)
    return
  }
  
  console.log('Results:', data?.length || 0)
  if (data && data.length > 0) {
    console.log('First result has embedding:', !!data[0].embedding)
    console.log('Embedding type:', typeof data[0].embedding)
    console.log('Embedding preview:', String(data[0].embedding).slice(0, 80))
    console.log('Score:', data[0].score)
  }
}

test()
