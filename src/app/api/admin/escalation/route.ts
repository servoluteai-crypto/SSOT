import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sectionId, contactName, contactEmail, keywordsEnabled, keywords } =
      await request.json()

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
    }

    // In a production app, this would persist to the database.
    // For MVP, we log the change and return success.
    // The config files serve as the source of truth and would need
    // a deployment to update. A database-backed config would be the
    // next evolution.
    console.log('Escalation config update:', {
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
