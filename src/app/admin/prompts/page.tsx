'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SECTIONS } from '../../../../config/sections'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.2)',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  padding: '14px 16px',
  fontSize: '13.5px',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  lineHeight: '1.65',
  resize: 'vertical',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

function PrimaryButton({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'rgba(201,168,76,0.35)' : 'var(--ehl-gold)',
        color: '#0f1a10',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
        letterSpacing: '0.02em',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--ehl-gold-lt)' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'var(--ehl-gold)' }}
    >
      {children}
    </button>
  )
}

function GhostButton({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        color: 'var(--muted)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--foreground)'
        e.currentTarget.style.borderColor = 'rgba(240,237,230,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--muted)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {children}
    </button>
  )
}

export default function AdminPromptsPage() {
  const [selectedSection, setSelectedSection] = useState(
    SECTIONS.filter((s) => s.status === 'active')[0]?.id || ''
  )
  const [activePrompt, setActivePrompt] = useState('')
  const [draftPrompt, setDraftPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastEdited, setLastEdited] = useState<string | null>(null)

  const activeSections = SECTIONS.filter((s) => s.status === 'active')

  const loadPrompt = useCallback(async () => {
    setLoading(true)
    setStatus(null)
    const supabase = createClient()
    const { data: doc } = await supabase
      .from('documents')
      .select('system_prompt, uploaded_at')
      .eq('section_id', selectedSection)
      .eq('is_active', true)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single()

    if (doc?.system_prompt) {
      setActivePrompt(doc.system_prompt)
      setLastEdited(doc.uploaded_at)
    } else {
      try {
        const res = await fetch(`/api/admin/prompt?sectionId=${selectedSection}`)
        const data = await res.json()
        setActivePrompt(data.prompt || '')
      } catch { setActivePrompt('') }
      setLastEdited(null)
    }
    setDraftPrompt('')
    setLoading(false)
  }, [selectedSection])

  useEffect(() => { loadPrompt() }, [loadPrompt])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('documents')
      .update({ system_prompt: activePrompt })
      .eq('section_id', selectedSection)
      .eq('is_active', true)

    setStatus(error
      ? { type: 'error', msg: 'Failed to save prompt.' }
      : { type: 'success', msg: 'Prompt saved.' }
    )
    if (!error) setLastEdited(new Date().toISOString())
    setSaving(false)
  }

  async function handleRegenerateDraft() {
    setStatus({ type: 'info', msg: 'Regenerating draft from document…' })
    try {
      const res = await fetch('/api/admin/regenerate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: selectedSection }),
      })
      const data = await res.json()
      if (data.draftPrompt) {
        setDraftPrompt(data.draftPrompt)
        setStatus({ type: 'success', msg: 'Draft generated — review and activate below.' })
      } else {
        setStatus({ type: 'error', msg: 'Could not generate draft. Ensure a document is uploaded.' })
      }
    } catch {
      setStatus({ type: 'error', msg: 'Failed to regenerate draft.' })
    }
  }

  const statusColor = status?.type === 'error' ? '#e05252' : status?.type === 'success' ? '#4caf7d' : 'var(--muted)'

  return (
    <div>
      {/* Section tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {activeSections.map((s) => {
          const isActive = selectedSection === s.id
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSection(s.id)}
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

      {loading ? (
        <p style={{ fontSize: '14px', color: 'var(--muted)', paddingTop: '10px' }}>Loading…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Active prompt */}
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
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#4caf7d',
                    boxShadow: '0 0 6px rgba(76,175,125,0.5)',
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>
                  Active Prompt
                </span>
              </div>
              {lastEdited && (
                <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                  Last updated {new Date(lastEdited).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>

            <div style={{ padding: '18px 22px 20px' }}>
              <textarea
                value={activePrompt}
                onChange={(e) => setActivePrompt(e.target.value)}
                rows={13}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                <PrimaryButton onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Prompt'}
                </PrimaryButton>
                <GhostButton onClick={handleRegenerateDraft}>
                  Regenerate Draft
                </GhostButton>
              </div>
            </div>
          </div>

          {/* Draft prompt */}
          {draftPrompt && (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 22px',
                  borderBottom: '1px solid rgba(201,168,76,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ehl-gold)', opacity: 0.7 }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ehl-gold)' }}>
                  Draft — Review before activating
                </span>
              </div>

              <div style={{ padding: '18px 22px 20px' }}>
                <textarea
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  rows={11}
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
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <PrimaryButton onClick={() => { setActivePrompt(draftPrompt); setDraftPrompt(''); setStatus({ type: 'success', msg: 'Draft activated — click Save to persist.' }) }}>
                    Activate Draft
                  </PrimaryButton>
                  <GhostButton onClick={() => setDraftPrompt('')}>
                    Discard
                  </GhostButton>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          {status && (
            <div
              style={{
                padding: '11px 16px',
                borderRadius: '8px',
                background: status.type === 'error' ? 'rgba(224,82,82,0.08)' : status.type === 'success' ? 'rgba(76,175,125,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${status.type === 'error' ? 'rgba(224,82,82,0.2)' : status.type === 'success' ? 'rgba(76,175,125,0.2)' : 'var(--border)'}`,
                fontSize: '13px',
                color: statusColor,
              }}
            >
              {status.msg}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
