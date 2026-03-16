'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TOP_LEVEL_SECTIONS, SECTIONS, getSectionsByParent } from '../../config/sections'

function SectionIcon({ id }: { id: string }) {
  if (id === 'hr') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
        color: 'var(--ehl-gold)',
        opacity: 0.7,
      }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

export default function HomePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 py-14"
      style={{
        background: 'var(--ehl-green)',
        backgroundImage: `
          radial-gradient(ellipse 90% 55% at 50% -5%, rgba(201,168,76,0.09) 0%, transparent 65%),
          radial-gradient(ellipse 70% 50% at 50% 110%, rgba(0,0,0,0.3) 0%, transparent 70%)
        `,
      }}
    >
      {/* Logo + heading block */}
      <div className="text-center mb-12 flex flex-col items-center gap-5">
        <img
          src="/logo.png"
          alt="EHL Experiences"
          style={{ width: '240px', height: 'auto' }}
        />
      </div>

      {/* Navigation */}
      <nav className="w-full max-w-[400px] flex flex-col gap-2.5">
        {TOP_LEVEL_SECTIONS.map((topSection) => {
          const subSections = getSectionsByParent(topSection.id)
          const directSection = SECTIONS.find((s) => s.id === topSection.id && s.parent === null)
          const hasSubSections = subSections.length > 0
          const isExpanded = expandedSection === topSection.id

          const baseCardStyle: React.CSSProperties = {
            background: 'rgba(242,240,236,0.97)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            padding: '16px 18px',
            color: 'var(--ehl-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            transition: 'background 0.18s, border-color 0.18s, transform 0.15s, box-shadow 0.18s',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }

          const CardContent = ({ label, description }: { label: string; description: string }) => (
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-lg"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'var(--ehl-green)',
                  color: 'var(--ehl-gold)',
                }}
              >
                <SectionIcon id={topSection.id} />
              </div>
              <div className="min-w-0">
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#1a1a18', letterSpacing: '0.01em' }}>
                  {label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  {description}
                </div>
              </div>
            </div>
          )

          // Direct section (e.g. HR)
          if (!hasSubSections && directSection) {
            if (directSection.status === 'coming-soon') {
              return (
                <div key={topSection.id} style={{ ...baseCardStyle, opacity: 0.45, cursor: 'not-allowed' }}>
                  <CardContent label={topSection.label} description={topSection.description} />
                  <span
                    className="uppercase tracking-widest flex-shrink-0 ml-3"
                    style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}
                  >
                    Soon
                  </span>
                </div>
              )
            }

            return (
              <Link
                key={topSection.id}
                href={`/${topSection.id}`}
                style={baseCardStyle}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.background = '#ffffff'
                  el.style.borderColor = 'rgba(201,168,76,0.4)'
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 10px 28px rgba(0,0,0,0.22)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(242,240,236,0.97)'
                  el.style.borderColor = 'rgba(255,255,255,0.12)'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                <CardContent label={topSection.label} description={topSection.description} />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ehl-gold)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0.7, flexShrink: 0, marginLeft: '12px' }}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            )
          }

          // Parent section with sub-sections (Operations)
          return (
            <div key={topSection.id}>
              <button
                onClick={() => setExpandedSection(isExpanded ? null : topSection.id)}
                style={{
                  ...baseCardStyle,
                  width: '100%',
                  textAlign: 'left',
                  borderBottomLeftRadius: isExpanded ? '0' : '12px',
                  borderBottomRightRadius: isExpanded ? '0' : '12px',
                  borderBottom: isExpanded ? '1px solid rgba(201,168,76,0.2)' : '1px solid rgba(255,255,255,0.12)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.background = '#ffffff'
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 10px 28px rgba(0,0,0,0.22)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(242,240,236,0.97)'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                <CardContent label={topSection.label} description={topSection.description} />
                <div style={{ marginLeft: '12px', flexShrink: 0 }}>
                  <ChevronIcon open={isExpanded} />
                </div>
              </button>

              {isExpanded && (
                <div
                  className="flex flex-col"
                  style={{
                    background: 'rgba(235,232,227,0.97)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderTop: 'none',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                  }}
                >
                  {subSections.map((sub, idx) => {
                    const isLast = idx === subSections.length - 1

                    if (sub.status === 'coming-soon') {
                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between px-5 py-3.5"
                          style={{
                            opacity: 0.45,
                            cursor: 'not-allowed',
                            borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a18' }}>{sub.label}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '1px' }}>{sub.description}</div>
                          </div>
                          <span
                            className="uppercase tracking-widest flex-shrink-0 ml-3"
                            style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}
                          >
                            Soon
                          </span>
                        </div>
                      )
                    }

                    const href = sub.parent ? `/${sub.parent}/${sub.id}` : `/${sub.id}`
                    return (
                      <Link
                        key={sub.id}
                        href={href}
                        className="flex items-center justify-between px-5 py-3.5 transition-all"
                        style={{
                          borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined,
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                          e.currentTarget.style.paddingLeft = '22px'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.paddingLeft = '20px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a18' }}>{sub.label}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '1px' }}>{sub.description}</div>
                        </div>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--ehl-gold)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ opacity: 0.7, flexShrink: 0, marginLeft: '12px' }}
                        >
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <footer className="mt-14 flex flex-col items-center gap-2">
        <div style={{ width: '20px', height: '1px', background: 'rgba(201,168,76,0.3)' }} />
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          EHL Experiences
        </p>
      </footer>
    </main>
  )
}
