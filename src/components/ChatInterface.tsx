'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Message } from '@/types'
import type { Section } from '../../config/sections'
import { PdfViewerModal } from './PdfViewerModal'

interface ChatInterfaceProps {
  section: Section
}

export function ChatInterface({ section }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfFilename, setPdfFilename] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: section.id,
          query: trimmed,
          conversationHistory: messages,
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessage(input)
  }

  const handleSuggestedQuestion = (q: string) => {
    sendMessage(q)
  }

  const handleViewDocument = async (documentName: string) => {
    try {
      const res = await fetch(
        `/api/documents/signed-url?filename=${encodeURIComponent(documentName)}&sectionId=${section.id}`
      )
      if (!res.ok) throw new Error('Failed to get document URL')
      const { url } = await res.json()
      setPdfFilename(documentName)
      setPdfUrl(url)
    } catch {
      alert('Could not load document. Please try again.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center gap-3.5 px-5"
        style={{
          background: 'var(--ehl-green)',
          height: '64px',
          borderBottom: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}
      >
        <a
          href="/"
          className="flex items-center justify-center transition-opacity opacity-70 hover:opacity-100"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: '1px solid rgba(201,168,76,0.3)',
            color: 'var(--ehl-gold)',
            fontSize: '18px',
            lineHeight: 1,
            flexShrink: 0,
          }}
          aria-label="Back"
        >
          ‹
        </a>

        <div className="flex-1 min-w-0">
          <h1
            className="font-serif leading-tight truncate"
            style={{ fontSize: '19px', color: '#ffffff', fontWeight: 500, letterSpacing: '0.02em' }}
          >
            {section.label}
          </h1>
          <p
            className="uppercase tracking-widest truncate"
            style={{ fontSize: '10.5px', color: 'var(--ehl-gold)', opacity: 0.75, letterSpacing: '0.1em', marginTop: '1px' }}
          >
            EHL Experiences
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="block rounded-full"
            style={{ width: '7px', height: '7px', background: '#4caf7d' }}
          />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
            Live
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="max-w-[720px] w-full mx-auto flex flex-col gap-4">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center pt-8 pb-4 gap-6 message-enter">

              <div
                className="flex items-center justify-center rounded-2xl"
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'var(--ehl-green)',
                  boxShadow: '0 4px 16px rgba(30,45,31,0.25)',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ehl-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>

              <div className="text-center">
                <h2
                  className="font-serif mb-1"
                  style={{ fontSize: '21px', color: 'var(--ehl-black)', fontWeight: 500 }}
                >
                  How can I help?
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
                  Ask any question — I&apos;ll find the answer from our documents.
                </p>
              </div>

              {/* Suggested questions */}
              {section.suggestedQuestions.length > 0 && (
                <div className="w-full grid grid-cols-2 gap-2.5">
                  {section.suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(q)}
                      className="text-left rounded-xl px-3.5 py-3 transition-all"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        fontSize: '12.5px',
                        color: 'var(--foreground)',
                        lineHeight: '1.45',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
                        e.currentTarget.style.background = 'var(--card-hover)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.background = 'var(--surface)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <span style={{ color: 'var(--ehl-gold)', marginRight: '5px', fontSize: '12px' }}>↗</span>
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversation */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex message-enter ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div
                  className="rounded-[18px] rounded-br-[5px] px-4 py-3"
                  style={{
                    background: 'var(--ehl-green)',
                    color: '#f0ede6',
                    maxWidth: '72%',
                    fontSize: '14.5px',
                    lineHeight: '1.55',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                >
                  {msg.content}
                </div>
              ) : (
                <div
                  className="rounded-[5px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px]"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    maxWidth: '90%',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  {/* AI label strip */}
                  <div
                    className="flex items-center gap-2 px-5 pt-3.5 pb-2.5"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div
                      className="flex items-center justify-center rounded-md flex-shrink-0"
                      style={{
                        width: '20px',
                        height: '20px',
                        background: 'var(--ehl-gold-dim)',
                        border: '1px solid rgba(201,168,76,0.2)',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ehl-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                    </div>
                    <span
                      className="uppercase tracking-widest"
                      style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}
                    >
                      {section.label}
                    </span>
                  </div>

                  {/* Answer body */}
                  <div className="px-5 py-4">
                    <div
                      className="prose max-w-none"
                      style={{ color: 'var(--foreground)', fontSize: '14.5px', lineHeight: '1.7' }}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ marginBottom: '10px' }}>{children}</p>,
                          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                          ul: ({ children }) => <ul style={{ marginBottom: '10px', paddingLeft: '18px' }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ marginBottom: '10px', paddingLeft: '18px' }}>{children}</ol>,
                          li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div
                        className="mt-4 pt-3"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <p
                          className="uppercase tracking-widest mb-2"
                          style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}
                        >
                          Sources
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((citation, ci) => (
                            <div
                              key={ci}
                              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                              style={{
                                background: 'var(--background)',
                                border: '1px solid var(--border)',
                                fontSize: '12px',
                              }}
                            >
                              <svg width="11" height="12" viewBox="0 0 13 14" fill="none">
                                <path d="M2 1h7l3 3v9H2V1z" stroke="var(--muted)" strokeWidth="1.2" fill="none"/>
                                <path d="M8 1v3h3" stroke="var(--muted)" strokeWidth="1.2" fill="none"/>
                              </svg>
                              <span style={{ color: 'var(--muted)' }}>{citation.documentName}</span>
                              <button
                                onClick={() => handleViewDocument(citation.documentName)}
                                className="font-medium ml-0.5 transition-colors"
                                style={{ fontSize: '12px', color: 'var(--ehl-gold)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--ehl-gold-lt)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--ehl-gold)')}
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start message-enter">
              <div
                className="rounded-[5px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px] px-5 py-3.5"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <div className="flex gap-1.5 items-center">
                  <div className="rounded-full animate-bounce" style={{ width: '7px', height: '7px', background: 'var(--ehl-gold)', animationDelay: '0ms', opacity: 0.6 }} />
                  <div className="rounded-full animate-bounce" style={{ width: '7px', height: '7px', background: 'var(--ehl-gold)', animationDelay: '160ms', opacity: 0.6 }} />
                  <div className="rounded-full animate-bounce" style={{ width: '7px', height: '7px', background: 'var(--ehl-gold)', animationDelay: '320ms', opacity: 0.6 }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 px-4 pt-3 pb-5"
        style={{
          background: 'var(--background)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <form onSubmit={handleSubmit} className="max-w-[720px] mx-auto flex gap-2.5 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            className="flex-1 rounded-[26px] px-5 py-3 text-sm outline-none transition-all"
            style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              color: 'var(--foreground)',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--ehl-gold)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.1)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 flex items-center justify-center rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              width: '46px',
              height: '46px',
              background: 'var(--ehl-green)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = 'var(--ehl-dark)' }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = 'var(--ehl-green)' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ehl-gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </form>
      </div>

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <PdfViewerModal url={pdfUrl} filename={pdfFilename} onClose={() => setPdfUrl(null)} />
      )}
    </div>
  )
}
