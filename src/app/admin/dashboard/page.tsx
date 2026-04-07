'use client'

import { useEffect, useState } from 'react'
import { SECTIONS } from '../../../../config/sections'
import Link from 'next/link'

interface SectionStats {
  sectionId: string
  label: string
  documentCount: number
  chunkCount: number
  activeDocument: string | null
}

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
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }} className="truncate">
          {sub}
        </p>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SectionStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const res = await fetch('/api/admin/dashboard')
      const data = await res.json()
      if (Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStats(data.map((stat: any) => ({
          sectionId: stat.section_id,
          label: SECTIONS.find((s) => s.id === stat.section_id)?.label || stat.section_id,
          documentCount: stat.documentCount,
          chunkCount: stat.chunkCount,
          activeDocument: stat.activeDocument,
        })))
      }
      setLoading(false)
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)', fontSize: '14px', paddingTop: '20px' }}>
        <div className="rounded-full animate-bounce" style={{ width: '7px', height: '7px', background: 'var(--ehl-gold)', opacity: 0.5 }} />
        Loading stats…
      </div>
    )
  }

  const totalDocs = stats.reduce((n, s) => n + s.documentCount, 0)
  const totalChunks = stats.reduce((n, s) => n + s.chunkCount, 0)

  return (
    <div>
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <StatCard label="Total Documents" value={totalDocs} />
        <StatCard label="Total Chunks" value={totalChunks} />
        <StatCard label="Active Sections" value={stats.length} />
      </div>

      {/* Per-section breakdown */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
          Sections
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {stats.map((s) => (
          <div
            key={s.sectionId}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(201,168,76,0.1)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ehl-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--foreground)' }}>{s.label}</span>
              </div>
              <Link
                href="/admin/documents"
                style={{ fontSize: '12px', color: 'var(--ehl-gold)', textDecoration: 'none', opacity: 0.8 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
              >
                Manage →
              </Link>
            </div>

            <div
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
              }}
            >
              {[
                { label: 'Documents', value: s.documentCount },
                { label: 'Chunks', value: s.chunkCount },
                { label: 'Active doc', value: s.activeDocument ? s.activeDocument.replace(/\.[^.]+$/, '') : '—', truncate: true },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'rgba(0,0,0,0.18)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <p style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {item.label}
                  </p>
                  <p
                    style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}
                    className={item.truncate ? 'truncate' : ''}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ marginTop: '28px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { href: '/admin/documents', label: 'Upload Documents' },
          { href: '/admin/prompts', label: 'Edit Prompts' },
          { href: '/admin/escalation', label: 'Escalation Settings' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '8px',
              fontSize: '13px', color: 'var(--ehl-gold)',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.18)',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(201,168,76,0.14)'
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.18)'
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
