import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, requesterAccessToken } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Verify the requester is a logged-in admin
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: userError } = await authClient.auth.getUser(requesterAccessToken)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    // Check requester is in admins table
    const { data: requester } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!requester) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Check if already an admin
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'That email is already an admin' }, { status: 409 })
    }

    const { error: insertError } = await supabase
      .from('admins')
      .insert({ email: email.toLowerCase().trim() })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to add admin' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
