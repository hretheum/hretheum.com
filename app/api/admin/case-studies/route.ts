import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Get project chunks from RAG index
    const { data, error } = await supabase
      .from('chunks')
      .select('text, metadata')
      .eq('metadata->source_type', 'project')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[case-studies] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Parse and format case studies
    const caseStudies = (data || []).map((chunk: any) => {
      const meta = chunk.metadata || {}
      const text = chunk.text || ''
      
      // Extract key sections from text
      const titleMatch = text.match(/## (.+?) —/)
      const challengeMatch = text.match(/## Challenge — .+?\n(.+?)(?=\n## |$)/s)
      const solutionMatch = text.match(/## Solution — .+?\n(.+?)(?=\n## |$)/s)
      const outcomeMatch = text.match(/## Results & Impact — .+?\n(.+?)(?=\n## |$)/s)
      
      return {
        title: meta.source_name || titleMatch?.[1] || 'Untitled Project',
        subtitle: meta.role || 'Digital Strategy & UX Leadership',
        challenge: challengeMatch?.[1]?.trim() || 'Challenge description not available',
        solution: solutionMatch?.[1]?.trim() || 'Solution description not available',
        outcome: outcomeMatch?.[1]?.trim() || 'Outcome description not available',
      }
    })

    return NextResponse.json({ data: caseStudies })
  } catch (error: any) {
    console.error('[case-studies] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
