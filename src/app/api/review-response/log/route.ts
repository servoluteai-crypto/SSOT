import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      venue = 'sole',
      manager,
      review_text,
      generated_response,
      final_response,
      was_edited,
      edit_distance,
      copied,
      not_useful,
      not_useful_reason,
    } = body

    if (!manager || !review_text || !generated_response) {
      return NextResponse.json(
        { error: 'manager, review_text, and generated_response are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    const { error } = await supabase.from('review_response_logs').insert({
      venue,
      manager,
      review_text,
      generated_response,
      final_response: final_response ?? null,
      was_edited: was_edited ?? null,
      edit_distance: edit_distance ?? null,
      copied: copied ?? false,
      not_useful: not_useful ?? false,
      not_useful_reason: not_useful_reason ?? null,
    })

    if (error) {
      console.error('review_response_logs insert error:', error)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Review log route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
