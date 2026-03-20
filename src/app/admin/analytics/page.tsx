'use client'

import { useEffect, useState, useCallback } from 'react'
import { SECTIONS } from '../../../../config/sections'
import type { QueryAnalytics, QueryTopic } from '@/types'

const activeSections = SECTIONS.filter((s) => s.status === 'active')

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px 22px',
      }}
    >
      <p style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
        {label}
      </p>
      <p style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ehl-gold)', lineHeight: 1, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function TopicCard({ topic, rank }: { topic: QueryTopic; rank: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--ehl-gold)',
            minWidth: '24px',
            textAlign: 'center',
            opacity: 0.7,
          }}
        >
          {rank}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>
            {topic.topic}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
            {topic.queries.length} variation{topic.queries.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            background: 'rgba(201,168,76,0.1)',
            color: 'var(--ehl-gold)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: '6px',
            padding: '3px 10px',
            flexShrink: 0,
          }}
        >
          {topic.count}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div
          style={{
            padding: '0 18px 14px',
            paddingLeft: '56px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {topic.queries.map((q, i) => (
            <p
              key={i}
              style={{
                fontSize: '12.5px',
                color: 'var(--muted)',
                padding: '4px 0',
                borderTop: i === 0 ? '1px solid var(--border)' : 'none',
                paddingTop: i === 0 ? '10px' : '4px',
              }}
            >
              &ldquo;{q}&rdquo;
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<QueryAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [sectionFilter, setSectionFilter] = useState('')
  const [days, setDays] = useState(30)

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ days: String(days) })
    if (sectionFilter) params.set('sectionId', sectionFilter)

    const res = await fetch(`/api/admin/analytics?${params}`)
    const data = await res.json()
    if (data.topTopics) setAnalytics(data)
    setLoading(false)
  }, [sectionFilter, days])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const avgPerDay = analytics
    ? analytics.queriesByDay.length > 0
      ? (analytics.totalQueries / analytics.queriesByDay.length).toFixed(1)
      : '0'
    : '—'

  const maxDayCount = analytics
    ? Math.max(...analytics.queriesByDay.map((d) => d.count), 1)
    : 1

  const maxSectionCount = analytics
    ? Math.max(...analytics.queriesBySection.map((s) => s.count), 1)
    : 1

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          <option value="">All Sections</option>
          {activeSections.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '4px' }}>
          {[7, 30, 90].map((d) => {
            const isActive = days === d
            return (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isActive ? 500 : 400,
                  background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                  color: isActive ? 'var(--ehl-gold)' : 'var(--muted)',
                  border: isActive ? '1px solid rgba(201,168,76,0.3)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {d}d
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)', fontSize: '14px', paddingTop: '20px' }}>
          <div className="rounded-full animate-bounce" style={{ width: '7px', height: '7px', background: 'var(--ehl-gold)', opacity: 0.5 }} />
          Loading analytics…
        </div>
      ) : !analytics ? (
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Failed to load analytics.</p>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            <StatCard label="Total Queries" value={analytics.totalQueries} />
            <StatCard label="Escalation Rate" value={`${(analytics.escalationRate * 100).toFixed(0)}%`} />
            <StatCard label="Avg / Day" value={avgPerDay} />
          </div>

          {/* Top Topics */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '14px' }}>
              Most Asked Topics
            </h2>

            {analytics.topTopics.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.12)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                }}
              >
                <p style={{ fontSize: '14px', color: 'var(--muted)' }}>No queries logged yet for this period.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {analytics.topTopics.map((topic, i) => (
                  <TopicCard key={i} topic={topic} rank={i + 1} />
                ))}
              </div>
            )}
          </div>

          {/* Queries by Section */}
          {!sectionFilter && analytics.queriesBySection.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '14px' }}>
                Queries by Section
              </h2>
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {analytics.queriesBySection.map((s) => {
                  const label = activeSections.find((sec) => sec.id === s.section_id)?.label || s.section_id
                  const pct = (s.count / maxSectionCount) * 100
                  return (
                    <div key={s.section_id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--foreground)' }}>{label}</span>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{s.count}</span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          borderRadius: '3px',
                          background: 'rgba(0,0,0,0.25)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            borderRadius: '3px',
                            background: 'var(--ehl-gold)',
                            opacity: 0.7,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Daily Trend */}
          {analytics.queriesByDay.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '14px' }}>
                Daily Trend
              </h2>
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '2px',
                    height: '120px',
                  }}
                >
                  {analytics.queriesByDay.map((d) => {
                    const heightPct = (d.count / maxDayCount) * 100
                    return (
                      <div
                        key={d.date}
                        title={`${d.date}: ${d.count} queries`}
                        style={{
                          flex: 1,
                          minWidth: '4px',
                          maxWidth: '24px',
                          height: `${Math.max(heightPct, 4)}%`,
                          background: 'var(--ehl-gold)',
                          opacity: 0.6,
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.3s, opacity 0.15s',
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6' }}
                      />
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    {analytics.queriesByDay[0]?.date}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    {analytics.queriesByDay[analytics.queriesByDay.length - 1]?.date}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
