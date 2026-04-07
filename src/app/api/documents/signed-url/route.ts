import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const sectionId = searchParams.get('sectionId')

    if (!filename || !sectionId) {
      return NextResponse.json(
        { error: 'filename and sectionId are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Look up storage_path by normalizing whitespace in both the query and DB value
    // This handles filenames with extra spaces in the DB not matching the normalized version
    const { data: doc, error: docError } = await supabase
      .rpc('find_document_by_normalized_filename', {
        p_section_id: sectionId,
        p_filename: filename,
      })

    if (docError || !doc || doc.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc[0].storage_path, 3600) // 1 hour expiry

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (error) {
    console.error('Signed URL error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
