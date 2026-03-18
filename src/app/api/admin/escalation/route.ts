import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const sectionId = request.nextUrl.searchParams.get('sectionId')

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: config, error } = await supabase
      .from('section_escalation_config')
      .select('contact_name, contact_email')
      .eq('section_id', sectionId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected if no config exists
      console.error('Failed to fetch escalation config:', error)
      return NextResponse.json({ error: 'Failed to fetch escalation config' }, { status: 500 })
    }

    return NextResponse.json({ config: config || null })
  } catch (error) {
    console.error('Escalation fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sectionId, contactName, contactEmail, keywordsEnabled, keywords } =
      await request.json()

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Persist escalation contact to database
    const { error: upsertError } = await supabase
      .from('section_escalation_config')
      .upsert({
        section_id: sectionId,
        contact_name: contactName,
        contact_email: contactEmail,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'section_id' })

    if (upsertError) {
      console.error('Failed to upsert escalation config:', upsertError)
      return NextResponse.json({ error: 'Failed to save escalation config' }, { status: 500 })
    }

    // TODO: Persist keyword settings once we have a keywords config table
    console.log('Escalation config updated:', {
      sectionId,
      contactName,
      contactEmail,
      keywordsEnabled,
      keywords,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Escalation update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
