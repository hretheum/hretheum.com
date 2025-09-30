import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createAdminClient } from '../utils/supabase/admin'

async function checkVectorDB() {
  const supabase = createAdminClient()

  // Check documents table
  const { data: docs, error: docsErr } = await supabase
    .from('documents')
    .select('id, file, source_type')
    .limit(10)

  console.log('📊 Documents in vector DB:', docs?.length || 0)
  if (docs && docs.length > 0) {
    console.log('\nSample documents:')
    docs.forEach(d => console.log(`  - ${d.file} (${d.source_type})`))
  } else {
    console.log('⚠️  No documents found in vector DB')
  }
  
  // Check if chunks have embeddings
  console.log('\n🔍 Checking if chunks have embeddings...')
  const { data: sampleChunks } = await supabase
    .from('chunks')
    .select('id, embedding')
    .limit(3)
  
  if (sampleChunks && sampleChunks.length > 0) {
    sampleChunks.forEach((c: any) => {
      const hasEmbedding = c.embedding && Array.isArray(c.embedding) && c.embedding.length > 0
      console.log(`  Chunk ${c.id}: ${hasEmbedding ? `✅ has embedding (${c.embedding.length} dims)` : '❌ NO embedding'}`)
      if (c.embedding) {
        console.log(`    Type: ${typeof c.embedding}, IsArray: ${Array.isArray(c.embedding)}`)
        console.log(`    Value: ${JSON.stringify(c.embedding).slice(0, 100)}`)
      }
    })
  } else {
    console.log('  ⚠️ No chunks to check')
  }
  
  // Test RPC function directly
  console.log('\n🔍 Testing match_chunks RPC...')
  const dummyEmbedding = new Array(1536).fill(0).map(() => Math.random())
  const { data: rpcResults, error: rpcError } = await supabase.rpc('match_chunks', {
    query_embedding: dummyEmbedding as any,
    match_count: 5,
    similarity_threshold: 0.1,
  })
  
  if (rpcError) {
    console.log('❌ RPC Error:', rpcError.message)
  } else {
    console.log('✅ RPC returned:', rpcResults?.length || 0, 'results')
    if (rpcResults && rpcResults.length > 0) {
      console.log('Sample result:', {
        score: rpcResults[0].score,
        text: rpcResults[0].text?.slice(0, 80),
        source_type: rpcResults[0].source_type
      })
    }
  }

  // Check chunks table with COUNT
  const { count: chunkCount } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true })

  console.log('\n📊 Total chunks in vector DB:', chunkCount || 0)
  
  // Get sample chunks
  const { data: chunks, error: chunksErr } = await supabase
    .from('chunks')
    .select('id, document_id, text, metadata')
    .limit(10)

  console.log('Sample chunks fetched:', chunks?.length || 0)
  if (chunks && chunks.length > 0) {
    console.log('\nSample chunk types:')
    const types = new Set(chunks.map(c => c.metadata?.type || 'unknown'))
    types.forEach(t => {
      const count = chunks.filter(c => (c.metadata?.type || 'unknown') === t).length
      console.log(`  - ${t}: ${count} chunks`)
    })
  } else {
    console.log('⚠️  No chunks found in vector DB')
  }

  // Check for portfolio/case study chunks
  const { data: portfolioChunks, error: portfolioErr } = await supabase
    .from('chunks')
    .select('id, text, metadata')
    .or('metadata->>type.eq.case_study,metadata->>type.eq.project,metadata->>type.eq.portfolio')
    .limit(5)

  console.log('\n📊 Portfolio/Case Study chunks:', portfolioChunks?.length || 0)
  if (portfolioChunks && portfolioChunks.length > 0) {
    portfolioChunks.forEach(c => {
      console.log(`  - ${c.metadata?.type}: ${c.text.slice(0, 80)}...`)
    })
  } else {
    console.log('⚠️  No portfolio/case study chunks found')
    console.log('\n💡 This explains why RAG returns 0 results!')
    console.log('   Need to ingest portfolio data into vector DB.')
  }
}

checkVectorDB()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
