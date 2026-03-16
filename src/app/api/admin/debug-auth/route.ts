import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // List all auth users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const userSummaries = users.users.map(u => ({
      id: u.id,
      email: u.email,
      email_confirmed_at: u.email_confirmed_at,
      confirmed_at: u.confirmed_at,
      created_at: u.created_at,
    }))

    // Try signing in with anon key to test
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: 'lawrence.hennessy@ehl.ie',
      password: 'Tintin6031',
    })

    return NextResponse.json({
      users: userSummaries,
      signInTest: {
        success: !signInError,
        error: signInError?.message,
        errorStatus: signInError?.status,
        userId: signInData?.user?.id,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
