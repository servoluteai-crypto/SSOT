import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ isAdmin: false })
    }

    const supabase = createServiceRoleClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single()

    return NextResponse.json({ isAdmin: !!admin })
  } catch {
    return NextResponse.json({ isAdmin: false })
  }
}
