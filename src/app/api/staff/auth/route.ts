import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('staff_config')
      .select('pin')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Staff access not configured on server' },
        { status: 500 }
      )
    }

    if (String(pin).trim() !== String(data.pin).trim()) {
      return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('ehl_staff_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
