import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Fetch status from campaign_processing_status table
    const { data, error } = await supabase
      .from('campaign_processing_status')
      .select('*')
      .eq('job_id', jobId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - job might not have started yet
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      console.error('[campaigns/status] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data.status)
  } catch (error: any) {
    console.error('[campaigns/status] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
