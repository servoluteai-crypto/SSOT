'use client'

import { useEffect, useState, useCallback } from 'react'

type ReviewAnalytics = {
  total: number
  copied: number
  notUseful: number
  edited: number
  copyRate: number
  editRate: number
  notUsefulRate: number
  notUsefulReasons: { reason: string; count: number }[]
  byManager: { name: string; total: number; copied: number; edited: number; not_useful: number }[]
  byDay: { date: string; count: number }[]
  recentEdits: {
    id: string
    created_at: string
    manager: string
    review_text: string
    generated_response: string
    final_response: string
    edit_distance: number
  }[]
  notUsefulLogs: {
    id: string
    created_at: string
    manager: string
    review_text: string
    generated_response: string
    not_useful_reason: string | null
  }[]
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 22px' }}>
      <p style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
        {label}
      </p>
      <p style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ehl-gold)', lineHeight: 1, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>{sub}</p>}
    </div>
  )
}

function EditRow({ log }: { log: ReviewAnalytics['recentEdits'][0] }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const managerLabel = log.manager === 'karlo' ? 'Karlo' : 'Victor'

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: '11px', color: 'var(--muted)', minWidth: '52px', flexShrink: 0 }}>{date}</span>
        <span style={{
          fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '5px',
          background: 'rgba(201,168,76,0.1)', color: 'var(--ehl-gold)',
          border: '1px solid rgba(201,168,76,0.2)', flexShrink: 0,
        }}>
          {managerLabel}
        </span>
        <p style={{ flex: 1, fontSize: '13px', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {log.review_text}
        </p>
        <span style={{ fontSize: '11px', color: 'var(--muted)', flexShrink: 0 }}>
          +/- {log.edit_distance} chars
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', display: 'grid', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Review</p>
            <p style={{ fontSize: '13px', color: 'var(--foreground)', lineHeight: 1.6 }}>{log.review_text}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Generated</p>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{log.generated_response}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: 'var(--ehl-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Final (used)</p>
              <p style={{ fontSize: '12.5px', color: 'var(--foreground)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{log.final_response}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NotUsefulRow({ log }: { log: ReviewAnalytics['notUsefulLogs'][0] }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const managerLabel = log.manager === 'karlo' ? 'Karlo' : 'Victor'

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: '11px', color: 'var(--muted)', minWidth: '52px', flexShrink: 0 }}>{date}</span>
        <span style={{
          fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '5px',
          background: 'rgba(201,168,76,0.1)', color: 'var(--ehl-gold)',
          border: '1px solid rgba(201,168,76,0.2)', flexShrink: 0,
        }}>
          {managerLabel}
        </span>
        <p style={{ flex: 1, fontSize: '13px', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {log.review_text}
        </p>
        {log.not_useful_reason && (
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '5px', flexShrink: 0,
            background: 'rgba(220,60,60,0.1)', color: '#e07070',
            border: '1px solid rgba(220,60,60,0.2)',
          }}>
            {log.not_useful_reason}
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', display: 'grid', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Review</p>
            <p style={{ fontSize: '13px', color: 'var(--foreground)', lineHeight: 1.6 }}>{log.review_text}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: '#e07070', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Generated (rejected)</p>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{log.generated_response}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [data, setData] = useState<ReviewAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [managerFilter, setManagerFilter] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (customMode && fromDate && toDate) {
      params.set('from', fromDate)
      params.set('to', toDate)
    } else {
      params.set('days', String(days))
    }
    if (managerFilter) params.set('manager', managerFilter)
    const res = await fetch(`/api/admin/reviews?${params}`)
    const json = await res.json()
    if (!json.error) setData(json)
    setLoading(false)
  }, [days, managerFilter, customMode, fromDate, toDate])

  useEffect(() => { load() }, [load])

  const maxDay = data ? Math.max(...data.byDay.map((d) => d.count), 1) : 1

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={managerFilter}
          onChange={(e) => setManagerFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px', background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <option value="">All Managers</option>
          <option value="karlo">Karlo</option>
          <option value="victor">Victor</option>
        </select>

        <div style={{ display: 'flex', gap: '4px' }}>
          {[7, 30, 90].map((d) => {
            const isActive = !customMode && days === d
            return (
              <button key={d} onClick={() => { setCustomMode(false); setDays(d) }} style={{
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: isActive ? 'var(--ehl-gold)' : 'var(--muted)',
                border: isActive ? '1px solid rgba(201,168,76,0.3)' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {d}d
              </button>
            )
          })}
          <button onClick={() => setCustomMode(!customMode)} style={{
            padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
            fontWeight: customMode ? 500 : 400,
            background: customMode ? 'rgba(201,168,76,0.12)' : 'transparent',
            color: customMode ? 'var(--ehl-gold)' : 'var(--muted)',
            border: customMode ? '1px solid rgba(201,168,76,0.3)' : '1px solid var(--border)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            Custom
          </button>
        </div>

        {customMode && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '13px', background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '13px', background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
            />
            <button
              onClick={load}
              disabled={!fromDate || !toDate}
              style={{
                padding: '7px 14px', borderRadius: '8px', fontSize: '13px',
                background: fromDate && toDate ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: fromDate && toDate ? 'var(--ehl-gold)' : 'var(--muted)',
                border: '1px solid rgba(201,168,76,0.3)',
                cursor: fromDate && toDate ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)', fontSize: '14px', paddingTop: '20px' }}>
          <div className="rounded-full animate-bounce" style={{ width: '7px', height: '7px', background: 'var(--ehl-gold)', opacity: 0.5 }} />
          Loading…
        </div>
      ) : !data ? (
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Failed to load.</p>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard label="Generated" value={data.total} />
            <StatCard label="Copy Rate" value={`${(data.copyRate * 100).toFixed(0)}%`} sub={`${data.copied} used`} />
            <StatCard label="Edit Rate" value={`${(data.editRate * 100).toFixed(0)}%`} sub="of copied responses" />
            <StatCard label="Not Useful" value={`${(data.notUsefulRate * 100).toFixed(0)}%`} sub={`${data.notUseful} flagged`} />
          </div>

          {/* By manager */}
          {data.byManager.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '14px' }}>
                By Manager
              </h2>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Manager', 'Generated', 'Copied', 'Edited', 'Not Useful'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.byManager.map((m) => (
                      <tr key={m.name} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: 500, textTransform: 'capitalize' }}>{m.name}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{m.total}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                          {m.copied} <span style={{ color: 'var(--ehl-gold)', fontSize: '11px' }}>({m.total > 0 ? Math.round((m.copied / m.total) * 100) : 0}%)</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                          {m.edited} <span style={{ fontSize: '11px' }}>({m.copied > 0 ? Math.round((m.edited / m.copied) * 100) : 0}%)</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{m.not_useful}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Not useful reasons */}
          {data.notUsefulReasons.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '14px' }}>
                Not Useful — Reasons
              </h2>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.notUsefulReasons.map((r) => {
                  const pct = (r.count / data.notUseful) * 100
                  return (
                    <div key={r.reason}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--foreground)' }}>{r.reason}</span>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{r.count}</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '3px', background: 'var(--ehl-gold)', opacity: 0.7, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Not useful responses */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '4px' }}>
              Not Useful Responses
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
              Responses flagged as unhelpful — use these to improve prompts or fine-tune
            </p>
            {data.notUsefulLogs.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.12)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: 'var(--muted)' }}>No flagged responses yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.notUsefulLogs.map((log) => (
                  <NotUsefulRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>

          {/* Daily trend */}
          {data.byDay.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '14px' }}>
                Daily Usage
              </h2>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '80px' }}>
                  {data.byDay.map((d) => (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.count}`}
                      style={{
                        flex: 1, minWidth: '4px', maxWidth: '24px',
                        height: `${Math.max((d.count / maxDay) * 100, 4)}%`,
                        background: 'var(--ehl-gold)', opacity: 0.6,
                        borderRadius: '3px 3px 0 0', cursor: 'default', transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6' }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{data.byDay[0]?.date}</span>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{data.byDay[data.byDay.length - 1]?.date}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent edits — training data candidates */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '4px' }}>
              Edited Responses
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
              Responses that were copied after being edited — candidates for training data
            </p>
            {data.recentEdits.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.12)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: 'var(--muted)' }}>No edited responses yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.recentEdits.map((log) => (
                  <EditRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
