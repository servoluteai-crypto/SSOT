import { NextRequest, NextResponse } from 'next/server'
import { answerQuestion } from '@/lib/rag/answerQuestion'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sectionId, query, conversationHistory } = await request.json()

    if (!sectionId || !query) {
      return NextResponse.json(
        { error: 'sectionId and query are required' },
        { status: 400 }
      )
    }

    const result = await answerQuestion(sectionId, query, conversationHistory || [])

    // Fire-and-forget: log anonymous query for analytics
    const supabase = createServiceRoleClient()
    supabase
      .from('query_logs')
      .insert({
        section_id: sectionId,
        query: query.trim().toLowerCase(),
        was_escalated: result.escalated,
        had_results: result.citations.length > 0,
      })
      .then(({ error }) => {
        if (error) console.error('Failed to log query:', error)
      })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
