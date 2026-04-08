'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminSettingsPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setStatus({ type: 'error', msg: 'You must be logged in.' })
        return
      }

      const res = await fetch('/api/admin/add-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, requesterAccessToken: session.access_token }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus({ type: 'success', msg: `${email} has been added as an admin.` })
        setEmail('')
      } else {
        setStatus({ type: 'error', msg: data.error || 'Something went wrong.' })
      }
    } catch {
      setStatus({ type: 'error', msg: 'Something went wrong.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '520px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1
          className="font-serif"
          style={{ fontSize: '22px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '6px' }}
        >
          Settings
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
          Manage admin access for the EHL SSOT platform.
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '4px' }}>
          Add Admin
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '18px' }}>
          They will need a Supabase Auth account with this email to log in.
        </p>

        <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@ehlexperiences.com"
            required
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.2)',
              border: '1.5px solid var(--border)',
              borderRadius: '10px',
              padding: '11px 16px',
              fontSize: '14px',
              color: 'var(--foreground)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--ehl-gold)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          {status && (
            <p style={{ fontSize: '13px', color: status.type === 'success' ? 'var(--ehl-gold)' : '#d95c5c' }}>
              {status.msg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              background: 'var(--ehl-green)',
              color: 'var(--ehl-gold)',
              border: 'none',
              borderRadius: '10px',
              padding: '11px 20px',
              fontSize: '12.5px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !email.trim() ? 0.4 : 1,
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Adding…' : 'Add Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
