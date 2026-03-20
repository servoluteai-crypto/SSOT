import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  noStore()
  try {
    const supabase = createServiceRoleClient()

    // Get document counts and active doc per section
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, section_id, filename, is_active, uploaded_at')

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    // Get chunk counts per section using SQL aggregation
    const { data: chunkRows, error: chunkError } = await supabase
      .rpc('get_chunk_counts_by_section')

    if (chunkError) {
      // Fallback: count manually if RPC doesn't exist yet
      const { data: allChunks, error: fallbackError } = await supabase
        .from('document_chunks')
        .select('section_id')

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }

      const chunksBySection: Record<string, number> = {}
      allChunks?.forEach((c: { section_id: string }) => {
        chunksBySection[c.section_id] = (chunksBySection[c.section_id] || 0) + 1
      })

      return NextResponse.json(buildStats(documents, chunksBySection))
    }

    const chunksBySection: Record<string, number> = {}
    chunkRows?.forEach((r: { section_id: string; chunk_count: number }) => {
      chunksBySection[r.section_id] = r.chunk_count
    })

    return NextResponse.json(buildStats(documents, chunksBySection))
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

function buildStats(
  documents: Array<{ id: string; section_id: string; filename: string; is_active: boolean; uploaded_at: string }>,
  chunksBySection: Record<string, number>
) {
  const stats: Record<string, { section_id: string; documentCount: number; chunkCount: number; activeDocument: string | null }> = {}

  for (const doc of documents) {
    if (!stats[doc.section_id]) {
      stats[doc.section_id] = {
        section_id: doc.section_id,
        documentCount: 0,
        chunkCount: chunksBySection[doc.section_id] || 0,
        activeDocument: null,
      }
    }
    stats[doc.section_id].documentCount += 1
    if (doc.is_active) {
      // Keep the most recently uploaded active doc as the display name
      const current = stats[doc.section_id].activeDocument
      if (!current) stats[doc.section_id].activeDocument = doc.filename
    }
  }

  return Object.values(stats)
}
