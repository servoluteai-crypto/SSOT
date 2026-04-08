'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (tokenHash && type === 'recovery') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
        if (error) {
          setStatus({ type: 'error', msg: 'Reset link is invalid or has expired.' })
        } else {
          setReady(true)
        }
      })
    } else {
      // Fallback: listen for PASSWORD_RECOVERY event (hash-based flow)
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true)
      })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setStatus({ type: 'error', msg: 'Passwords do not match.' })
      return
    }
    if (password.length < 8) {
      setStatus({ type: 'error', msg: 'Password must be at least 8 characters.' })
      return
    }

    setLoading(true)
    setStatus(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else {
      setStatus({ type: 'success', msg: 'Password updated. Redirecting to login…' })
      setTimeout(() => router.push('/admin'), 2000)
    }

    setLoading(false)
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
        <div className="text-center mb-12">
          <img src="/logo.svg" alt="EHL Experiences" style={{ width: '200px', height: 'auto', margin: '0 auto' }} />
        </div>

        <div
          className="rounded-2xl px-7 py-8"
          style={{ background: 'var(--background)', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}
        >
          <div className="mb-7">
            <h2
              className="font-serif mb-1.5"
              style={{ fontSize: '22px', color: 'var(--ehl-black)', fontWeight: 500 }}
            >
              Reset Password
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
              Enter your new password below.
            </p>
          </div>

          {!ready ? (
            <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>Verifying reset link…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                required
                className="w-full rounded-xl px-4 py-3.5 outline-none transition-all"
                style={{
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
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
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full rounded-xl px-4 py-3.5 outline-none transition-all"
                style={{
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
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
                disabled={loading || !password.trim() || !confirm.trim()}
                className="w-full rounded-xl py-3.5 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--ehl-green)',
                  color: 'var(--ehl-gold)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontSize: '12.5px',
                }}
              >
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
