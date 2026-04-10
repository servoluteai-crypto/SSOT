import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const manager = searchParams.get('manager') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    const supabase = createServiceRoleClient()

    const since = from
      ? new Date(from).toISOString()
      : new Date(Date.now() - days * 86400000).toISOString()
    const until = to
      ? new Date(new Date(to).getTime() + 86400000).toISOString() // include full end day
      : null

    let query = supabase
      .from('review_response_logs')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (until) {
      query = query.lt('created_at', until)
    }

    if (manager) {
      query = query.eq('manager', manager)
    }

    const { data: logs, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = logs || []
    const total = rows.length
    const copied = rows.filter((r) => r.copied).length
    const notUseful = rows.filter((r) => r.not_useful).length
    const edited = rows.filter((r) => r.was_edited && r.copied).length

    const copyRate = total > 0 ? copied / total : 0
    const editRate = copied > 0 ? edited / copied : 0
    const notUsefulRate = total > 0 ? notUseful / total : 0

    // Not useful reasons breakdown
    const reasonCounts: Record<string, number> = {}
    for (const row of rows) {
      if (row.not_useful_reason) {
        reasonCounts[row.not_useful_reason] = (reasonCounts[row.not_useful_reason] || 0) + 1
      }
    }
    const notUsefulReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    // By manager breakdown
    const managerStats: Record<string, { total: number; copied: number; edited: number; not_useful: number }> = {}
    for (const row of rows) {
      if (!managerStats[row.manager]) {
        managerStats[row.manager] = { total: 0, copied: 0, edited: 0, not_useful: 0 }
      }
      managerStats[row.manager].total++
      if (row.copied) managerStats[row.manager].copied++
      if (row.was_edited && row.copied) managerStats[row.manager].edited++
      if (row.not_useful) managerStats[row.manager].not_useful++
    }
    const byManager = Object.entries(managerStats).map(([name, s]) => ({ name, ...s }))

    // Daily trend
    const dayCounts = new Map<string, number>()
    for (const row of rows) {
      const date = new Date(row.created_at).toISOString().split('T')[0]
      dayCounts.set(date, (dayCounts.get(date) || 0) + 1)
    }
    const byDay = Array.from(dayCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Recent logs (last 20 that were copied and edited — training data candidates)
    const recentEdits = rows
      .filter((r) => r.copied && r.was_edited)
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        created_at: r.created_at,
        manager: r.manager,
        review_text: r.review_text,
        generated_response: r.generated_response,
        final_response: r.final_response,
        edit_distance: r.edit_distance,
      }))

    // Not useful logs — for understanding AI failures
    const notUsefulLogs = rows
      .filter((r) => r.not_useful)
      .slice(0, 50)
      .map((r) => ({
        id: r.id,
        created_at: r.created_at,
        manager: r.manager,
        review_text: r.review_text,
        generated_response: r.generated_response,
        not_useful_reason: r.not_useful_reason,
      }))

    return NextResponse.json({
      total,
      copied,
      notUseful,
      edited,
      copyRate,
      editRate,
      notUsefulRate,
      notUsefulReasons,
      byManager,
      byDay,
      recentEdits,
      notUsefulLogs,
    })
  } catch (error) {
    console.error('Reviews analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
