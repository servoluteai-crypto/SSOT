'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.session) {
        setError(data.error || 'Invalid email or password')
        setLoading(false)
        return
      }

      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      router.push('/admin/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,0,0,0.25)',
    border: '1.5px solid rgba(201,168,76,0.18)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#f0ede6',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#0f1a10',
        backgroundImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 65%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src="/logo.svg" alt="EHL Experiences" style={{ width: '180px', height: 'auto', margin: '0 auto' }} />
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '1px', background: 'rgba(201,168,76,0.4)' }} />
            <span style={{ fontSize: '10px', color: 'rgba(240,237,230,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Admin
            </span>
            <div style={{ width: '24px', height: '1px', background: 'rgba(201,168,76,0.4)' }} />
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#192b1a',
            border: '1px solid rgba(201,168,76,0.14)',
            borderRadius: '16px',
            padding: '32px 28px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '21px',
                fontWeight: 500,
                color: '#f0ede6',
                letterSpacing: '0.01em',
                marginBottom: '4px',
              }}
            >
              Sign In
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(240,237,230,0.45)' }}>
              EHL Experiences admin access
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              style={inputStyle}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.08)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.18)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={inputStyle}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.08)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.18)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />

            {error && (
              <p style={{ fontSize: '13px', color: '#e05252', textAlign: 'center', margin: '2px 0' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                background: loading ? 'rgba(201,168,76,0.4)' : '#c9a84c',
                color: '#0f1a10',
                border: 'none',
                borderRadius: '10px',
                padding: '13px',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#e8c97a' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#c9a84c' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a
            href="/"
            style={{ fontSize: '12px', color: 'rgba(240,237,230,0.3)', letterSpacing: '0.05em', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,237,230,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,237,230,0.3)'}
          >
            ← Back to app
          </a>
        </div>

      </div>
    </div>
  )
}
