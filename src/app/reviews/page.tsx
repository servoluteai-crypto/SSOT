'use client'

import { useState } from 'react'
import Link from 'next/link'

type Manager = 'karlo' | 'victor'

export default function ReviewsPage() {
  const [reviewerName, setReviewerName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [manager, setManager] = useState<Manager>('karlo')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Analytics state
  const [generatedResponse, setGeneratedResponse] = useState('')
  const [notUsefulLogged, setNotUsefulLogged] = useState(false)
  const [showReasonPicker, setShowReasonPicker] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const canGenerate = reviewerName.trim() && reviewText.trim() && !loading

  function logReview(payload: { copied: boolean; not_useful: boolean; not_useful_reason?: string }) {
    const finalResponse = response
    fetch('/api/review-response/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venue: 'sole',
        manager,
        review_text: reviewText,
        generated_response: generatedResponse,
        final_response: finalResponse,
        was_edited: generatedResponse !== finalResponse,
        edit_distance: Math.abs(generatedResponse.length - finalResponse.length),
        ...payload,
      }),
    }).catch(err => console.error('Failed to log review action:', err))
  }

  async function handleGenerate() {
    if (!canGenerate) return
    setLoading(true)
    setError('')
    setResponse('')
    setCopied(false)
    setGeneratedResponse('')
    setNotUsefulLogged(false)
    setShowReasonPicker(false)
    setFeedbackSubmitted(false)

    try {
      const res = await fetch('/api/review-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_text: reviewText.trim(),
          reviewer_name: reviewerName.trim(),
          manager,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate response')
      }

      const data = await res.json()
      setResponse(data.response)
      setGeneratedResponse(data.response)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(response)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = response
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    logReview({ copied: true, not_useful: false })
  }

  function handleNotUseful() {
    if (notUsefulLogged) return
    setNotUsefulLogged(true)
    setShowReasonPicker(true)
    logReview({ copied: false, not_useful: true })
  }

  function handleReasonSelect(reason: string) {
    logReview({ copied: false, not_useful: true, not_useful_reason: reason })
    setFeedbackSubmitted(true)
    setTimeout(() => {
      setShowReasonPicker(false)
      setFeedbackSubmitted(false)
    }, 1800)
  }

  function handleReasonDismiss() {
    setShowReasonPicker(false)
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center px-5 py-10"
      style={{
        background: 'var(--ehl-green)',
        backgroundImage: `
          radial-gradient(ellipse 90% 55% at 50% -5%, rgba(201,168,76,0.09) 0%, transparent 65%),
          radial-gradient(ellipse 70% 50% at 50% 110%, rgba(0,0,0,0.3) 0%, transparent 70%)
        `,
      }}
    >
      {/* Header */}
      <div className="w-full max-w-[540px] mb-8">
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            marginBottom: '20px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: '42px',
              height: '42px',
              background: 'rgba(242,240,236,0.97)',
              color: 'var(--ehl-gold)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div>
            <h1
              className="font-serif"
              style={{ fontSize: '22px', fontWeight: 500, color: '#f0ede6', letterSpacing: '0.01em' }}
            >
              Review Response
            </h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
              SOLE Seafood & Grill
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div
        className="w-full max-w-[540px]"
        style={{
          background: 'rgba(242,240,236,0.97)',
          borderRadius: '14px',
          padding: '24px 22px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {/* Manager Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#666', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Responding as
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {([
              { key: 'karlo' as Manager, label: 'Karlo Aleksic', subtitle: 'Deputy Director' },
              { key: 'victor' as Manager, label: 'Victor Nedelea', subtitle: 'Director' },
            ]).map(({ key, label, subtitle }) => (
              <button
                key={key}
                onClick={() => setManager(key)}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${manager === key ? 'var(--ehl-gold)' : 'rgba(0,0,0,0.08)'}`,
                  background: manager === key ? 'rgba(201,168,76,0.08)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a18' }}>{label}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Reviewer Name */}
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="reviewer-name"
            style={{ fontSize: '12px', fontWeight: 500, color: '#666', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}
          >
            Reviewer Name
          </label>
          <input
            id="reviewer-name"
            type="text"
            value={reviewerName}
            onChange={e => setReviewerName(e.target.value)}
            placeholder="e.g. John D"
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: '14px',
              color: '#1a1a18',
              background: 'white',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--ehl-gold)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}
          />
        </div>

        {/* Review Text */}
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="review-text"
            style={{ fontSize: '12px', fontWeight: 500, color: '#666', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}
          >
            Customer Review
          </label>
          <textarea
            id="review-text"
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Paste the customer's review here..."
            rows={6}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: '14px',
              color: '#1a1a18',
              background: 'white',
              outline: 'none',
              resize: 'vertical',
              lineHeight: '1.5',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--ehl-gold)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '10px',
            border: 'none',
            background: canGenerate ? 'var(--ehl-green)' : 'rgba(30,45,31,0.4)',
            color: canGenerate ? 'var(--ehl-gold)' : 'rgba(201,168,76,0.5)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            letterSpacing: '0.02em',
          }}
        >
          {loading ? 'Generating...' : 'Generate Response'}
        </button>

        {error && (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#d44', textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>

      {/* Response Output */}
      {response && (
        <div
          className="w-full max-w-[540px] mt-5"
          style={{
            background: 'rgba(242,240,236,0.97)',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#666', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Draft Response
            </label>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: copied ? 'var(--ehl-green)' : 'white',
                color: copied ? 'var(--ehl-gold)' : '#666',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Textarea or reason picker */}
          {showReasonPicker ? (
            <div style={{
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'white',
              padding: '16px 14px',
              minHeight: '140px',
            }}>
              {feedbackSubmitted ? (
                <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', paddingTop: '40px' }}>
                  Thanks for the feedback
                </p>
              ) : (
                <>
                  <p style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, marginBottom: '12px' }}>
                    What was the issue?
                  </p>
                  {(['Too formal', 'Too casual', 'Missed the point', 'Factually wrong'] as const).map(reason => (
                    <button
                      key={reason}
                      onClick={() => handleReasonSelect(reason)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: 'white',
                        color: '#1a1a18',
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        marginBottom: '8px',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--ehl-gold)'
                        e.currentTarget.style.background = 'rgba(201,168,76,0.06)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                  <button
                    onClick={handleReasonDismiss}
                    style={{
                      marginTop: '4px',
                      fontSize: '12px',
                      color: '#aaa',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                  >
                    Dismiss
                  </button>
                </>
              )}
            </div>
          ) : (
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.08)',
                fontSize: '14px',
                color: '#1a1a18',
                background: 'white',
                outline: 'none',
                resize: 'vertical',
                lineHeight: '1.6',
                fontFamily: 'inherit',
              }}
            />
          )}

          {/* Not useful row */}
          {!showReasonPicker && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={handleNotUseful}
                disabled={notUsefulLogged}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: 'white',
                  color: notUsefulLogged ? '#bbb' : '#888',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: notUsefulLogged ? 'default' : 'pointer',
                  opacity: notUsefulLogged ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                Not useful
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 flex flex-col items-center gap-2">
        <div style={{ width: '20px', height: '1px', background: 'rgba(201,168,76,0.3)' }} />
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          EHL Experiences
        </p>
      </footer>
    </main>
  )
}
