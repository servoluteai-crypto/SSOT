'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function StaffLoginForm() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/staff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })

      if (res.ok) {
        router.push(next)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Incorrect PIN. Please try again.')
        setPin('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        background: 'var(--ehl-green)',
        backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)`,
      }}
    >
      <div className="w-full max-w-[360px]">

        {/* Logo */}
        <div className="text-center mb-12">
          <img
            src="/logo.svg"
            alt="EHL Experiences"
            style={{ width: '200px', height: 'auto', margin: '0 auto' }}
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl px-7 py-8"
          style={{
            background: 'var(--background)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          }}
        >
          <div className="mb-7">
            <h2
              className="font-serif mb-1.5"
              style={{ fontSize: '22px', color: 'var(--ehl-black)', fontWeight: 500, letterSpacing: '0.01em' }}
            >
              Staff Access
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
              Enter your PIN to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="· · · · · ·"
              inputMode="numeric"
              autoFocus
              required
              className="w-full rounded-xl px-4 py-3.5 text-center text-xl tracking-[0.5em] outline-none transition-all"
              style={{
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
                color: 'var(--foreground)',
                fontFamily: 'monospace',
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

            {error && (
              <p className="text-center text-sm" style={{ color: '#d95c5c' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !pin.trim()}
              className="w-full rounded-xl py-3.5 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'var(--ehl-green)',
                color: 'var(--ehl-gold)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '12.5px',
              }}
            >
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <a
            href="/"
            style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}
          >
            ← Back to home
          </a>
        </div>

      </div>
    </main>
  )
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLoginForm />
    </Suspense>
  )
}
