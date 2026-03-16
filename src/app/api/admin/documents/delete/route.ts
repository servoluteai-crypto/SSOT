import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { docId, storagePath } = await request.json()

    if (!docId || !storagePath) {
      return NextResponse.json({ error: 'docId and storagePath required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Delete from database (cascades to chunks)
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([storagePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Don't fail if storage delete fails, document record is already gone
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
