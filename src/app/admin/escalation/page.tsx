'use client'

import { useState, useEffect } from 'react'
import { SECTIONS } from '../../../../config/sections'
import { ESCALATION_CONFIG } from '../../../../config/escalation-keywords'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.2)',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  padding: '11px 16px',
  fontSize: '14px',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '7px', fontWeight: 500 }}>
      {children}
    </label>
  )
}

interface EscalationConfig {
  contact_name: string
  contact_email: string
}

export default function AdminEscalationPage() {
  const activeSections = SECTIONS.filter((s) => s.status === 'active')
  const [selectedSection, setSelectedSection] = useState(activeSections[0]?.id || '')
  const [keywordsEnabled, setKeywordsEnabled] = useState(ESCALATION_CONFIG.enabled)
  const [keywords, setKeywords] = useState<string[]>([...ESCALATION_CONFIG.keywords])
  const [newKeyword, setNewKeyword] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const selectedConfig = SECTIONS.find((s) => s.id === selectedSection)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Load escalation config from database
  useEffect(() => {
    async function loadConfig() {
      if (!selectedSection) return
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/escalation?sectionId=${selectedSection}`)
        const data = await res.json()
        if (data.config) {
          setContactName(data.config.contact_name)
          setContactEmail(data.config.contact_email)
        } else {
          // Fallback to config file defaults
          setContactName(selectedConfig?.escalationContact?.name || '')
          setContactEmail(selectedConfig?.escalationContact?.email || '')
        }
      } catch (e) {
        console.error('Failed to load escalation config:', e)
        // Fallback to config file defaults
        setContactName(selectedConfig?.escalationContact?.name || '')
        setContactEmail(selectedConfig?.escalationContact?.email || '')
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [selectedSection, selectedConfig])

  function handleSectionChange(id: string) {
    setSelectedSection(id)
    const s = SECTIONS.find((sec) => sec.id === id)
    setContactName(s?.escalationContact?.name || '')
    setContactEmail(s?.escalationContact?.email || '')
    setStatus(null)
  }

  function handleAddKeyword() {
    const kw = newKeyword.trim().toLowerCase()
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw])
      setNewKeyword('')
    }
  }

  async function handleSave() {
    try {
      const res = await fetch('/api/admin/escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: selectedSection, contactName, contactEmail, keywordsEnabled, keywords }),
      })
      setStatus(res.ok
        ? { type: 'success', msg: 'Settings saved.' }
        : { type: 'error', msg: 'Failed to save settings.' }
      )
    } catch {
      setStatus({ type: 'error', msg: 'Failed to save settings.' })
    }
  }

  return (
    <div>
      {/* Section tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {activeSections.map((s) => {
          const isActive = selectedSection === s.id
          return (
            <button
              key={s.id}
              onClick={() => handleSectionChange(s.id)}
              style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: isActive ? 'var(--ehl-gold)' : 'var(--muted)',
                border: isActive ? '1px solid rgba(201,168,76,0.3)' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Contact card */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Escalation Contact</h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
              Shown to staff when the AI cannot answer or needs to escalate
            </p>
          </div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <Label>Name</Label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Courtney"
                style={inputStyle}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
            <div>
              <Label>Email</Label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. courtney@ehlexperiences.com"
                style={inputStyle}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Keyword card */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 22px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '2px' }}>
                Keyword Escalation Override
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.55 }}>
                When enabled, matching messages escalate immediately without AI processing. Off by default — the AI's natural language understanding is more accurate.
              </p>
            </div>

            {/* Toggle */}
            <button
              onClick={() => setKeywordsEnabled(!keywordsEnabled)}
              style={{
                position: 'relative', flexShrink: 0,
                width: '44px', height: '24px',
                borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: keywordsEnabled ? 'var(--ehl-gold)' : 'rgba(255,255,255,0.12)',
                transition: 'background 0.2s',
              }}
              aria-label="Toggle keyword escalation"
            >
              <span
                style={{
                  position: 'absolute', top: '3px',
                  left: keywordsEnabled ? '23px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: keywordsEnabled ? '#0f1a10' : 'rgba(240,237,230,0.5)',
                  transition: 'left 0.2s',
                  display: 'block',
                }}
              />
            </button>
          </div>

          <div style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                placeholder="Add keyword…"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                onClick={handleAddKeyword}
                style={{
                  padding: '0 18px', borderRadius: '10px', border: '1px solid var(--border)',
                  background: 'rgba(201,168,76,0.08)', color: 'var(--ehl-gold)',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
              >
                Add
              </button>
            </div>

            {keywords.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '5px 10px 5px 12px',
                      fontSize: '12.5px',
                      color: 'var(--foreground)',
                    }}
                  >
                    {kw}
                    <button
                      onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--muted)', fontSize: '14px', lineHeight: 1,
                        padding: '1px', transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#e05252'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>No keywords added yet.</p>
            )}
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSave}
            style={{
              background: 'var(--ehl-gold)', color: '#0f1a10',
              border: 'none', borderRadius: '8px',
              padding: '11px 28px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--ehl-gold-lt)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--ehl-gold)'}
          >
            Save Changes
          </button>

          {status && (
            <p
              style={{
                fontSize: '13px',
                color: status.type === 'error' ? '#e05252' : '#4caf7d',
              }}
            >
              {status.msg}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
