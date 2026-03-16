import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    // Get all sections
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    // Get chunk counts per section (no embedding vectors)
    const { data: chunkCounts, error: chunkError } = await supabase
      .from('document_chunks')
      .select('section_id', { count: 'exact' })

    if (chunkError) {
      return NextResponse.json({ error: chunkError.message }, { status: 500 })
    }

    // Count chunks per section
    const chunksBySection: Record<string, number> = {}
    chunkCounts?.forEach((c: any) => {
      chunksBySection[c.section_id] = (chunksBySection[c.section_id] || 0) + 1
    })

    // Group documents by section
    const stats = documents.reduce((acc: Record<string, any>, doc: any) => {
      if (!acc[doc.section_id]) {
        acc[doc.section_id] = {
          section_id: doc.section_id,
          documentCount: 0,
          chunkCount: chunksBySection[doc.section_id] || 0,
          activeDocument: null,
        }
      }
      acc[doc.section_id].documentCount += 1
      if (doc.is_active) {
        acc[doc.section_id].activeDocument = doc.filename
      }
      return acc
    }, {})

    return NextResponse.json(Object.values(stats))
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
