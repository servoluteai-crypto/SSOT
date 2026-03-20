import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { QueryAnalytics, QueryLog, QueryTopic } from '@/types'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

async function clusterQueries(
  queryCounts: { query: string; count: number }[]
): Promise<QueryTopic[]> {
  if (queryCounts.length === 0) return []

  // If only 1 unique query, no point clustering
  if (queryCounts.length === 1) {
    return queryCounts.map((q) => ({
      topic: q.query,
      count: q.count,
      queries: [q.query],
    }))
  }

  const queryList = queryCounts
    .map((q) => `"${q.query}" (${q.count})`)
    .join('\n')

  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Group these employee questions into topics. Each question has its count in parentheses.

${queryList}

Return ONLY valid JSON — no markdown, no explanation. Format:
[{"topic":"Short Topic Name","queries":["exact query 1","exact query 2"]}]

Rules:
- Topic names should be short (2-5 words), e.g. "Holiday Allowance", "Sick Leave Policy", "Bike Storage"
- Every query must appear in exactly one group
- Use the exact query strings as provided — do not modify them
- Sort groups by total count (highest first)
- If a query doesn't fit any group, give it its own topic`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'

  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
    const groups = JSON.parse(cleaned) as { topic: string; queries: string[] }[]

    // Build a lookup for counts
    const countMap = new Map(queryCounts.map((q) => [q.query, q.count]))

    return groups.map((g) => ({
      topic: g.topic,
      count: g.queries.reduce((sum, q) => sum + (countMap.get(q) || 0), 0),
      queries: g.queries,
    })).sort((a, b) => b.count - a.count)
  } catch {
    // Fallback: return ungrouped if Claude's response isn't valid JSON
    console.error('Failed to parse clustered queries, falling back to ungrouped')
    return queryCounts.map((q) => ({
      topic: q.query,
      count: q.count,
      queries: [q.query],
    }))
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')
    const days = parseInt(searchParams.get('days') || '30', 10)

    const supabase = createServiceRoleClient()
    const since = new Date(Date.now() - days * 86400000).toISOString()

    let query = supabase
      .from('query_logs')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (sectionId) {
      query = query.eq('section_id', sectionId)
    }

    const { data: logs, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (logs || []) as QueryLog[]

    // Count unique queries
    const queryCounts = new Map<string, number>()
    for (const row of rows) {
      queryCounts.set(row.query, (queryCounts.get(row.query) || 0) + 1)
    }
    const sortedQueries = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50) // Send top 50 unique queries to Claude for clustering

    // Cluster queries into topics via Claude
    const topTopics = await clusterQueries(sortedQueries)

    // Aggregate: total queries
    const totalQueries = rows.length

    // Aggregate: escalation rate
    const escalatedCount = rows.filter((r) => r.was_escalated).length
    const escalationRate = totalQueries > 0 ? escalatedCount / totalQueries : 0

    // Aggregate: queries by section
    const sectionCounts = new Map<string, number>()
    for (const row of rows) {
      sectionCounts.set(row.section_id, (sectionCounts.get(row.section_id) || 0) + 1)
    }
    const queriesBySection = Array.from(sectionCounts.entries())
      .map(([section_id, count]) => ({ section_id, count }))
      .sort((a, b) => b.count - a.count)

    // Aggregate: queries by day
    const dayCounts = new Map<string, number>()
    for (const row of rows) {
      const date = new Date(row.created_at).toISOString().split('T')[0]
      dayCounts.set(date, (dayCounts.get(date) || 0) + 1)
    }
    const queriesByDay = Array.from(dayCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const analytics: QueryAnalytics = {
      topTopics,
      totalQueries,
      escalationRate,
      queriesBySection,
      queriesByDay,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
