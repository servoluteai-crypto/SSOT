'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SECTIONS } from '../../../../config/sections'
import type { DocumentRecord } from '@/types'

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '22px 24px',
  marginBottom: '16px',
}

export default function AdminDocumentsPage() {
  const [selectedSection, setSelectedSection] = useState(
    SECTIONS.filter((s) => s.status === 'active')[0]?.id || ''
  )
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeSections = SECTIONS.filter((s) => s.status === 'active')

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/documents?sectionId=${selectedSection}`)
    const data = await res.json()
    setDocuments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [selectedSection])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  async function uploadFile(file: File) {
    if (!file) return
    setUploading(true)
    setUploadStatus({ type: 'info', msg: 'Processing document — this may take a moment…' })

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sectionId', selectedSection)
      formData.append('uploadedBy', user?.email || 'admin')

      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const result = await res.json()

      if (!res.ok) {
        setUploadStatus({ type: 'error', msg: result.error || 'Upload failed.' })
      } else {
        setUploadStatus({
          type: 'success',
          msg: `Uploaded successfully. ${result.chunkCount} chunks created.${result.extractionMethod === 'vision' ? ' (scanned PDF — text extracted via vision)' : ''}${result.draftPrompt ? ' Prompt draft ready — check Prompts tab.' : ''}`,
        })
        loadDocuments()
      }
    } catch {
      setUploadStatus({ type: 'error', msg: 'Upload failed. Please try again.' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      await uploadFile(file)
    }
  }

  async function handleDelete(docId: string, storagePath: string) {
    if (!confirm('Delete this document and all its chunks?')) return
    const res = await fetch('/api/admin/documents/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId, storagePath }),
    })
    if (res.ok) loadDocuments()
    else alert('Failed to delete document')
  }

  const statusColor = uploadStatus?.type === 'error' ? '#e05252'
    : uploadStatus?.type === 'success' ? '#4caf7d' : 'var(--muted)'

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
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: isActive ? 'var(--ehl-gold)' : 'var(--muted)',
                border: isActive ? '1px solid rgba(201,168,76,0.3)' : '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Upload area */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px', opacity: 0.7 }}>
          Upload Document
        </h3>

        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'rgba(201,168,76,0.6)' : 'rgba(201,168,76,0.2)'}`,
            borderRadius: '10px',
            padding: '32px 20px',
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            background: dragOver ? 'rgba(201,168,76,0.05)' : 'rgba(0,0,0,0.12)',
            transition: 'all 0.2s',
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[0, 160, 320].map((delay) => (
                  <div key={delay} className="rounded-full animate-bounce" style={{ width: '7px', height: '7px', background: 'var(--ehl-gold)', animationDelay: `${delay}ms`, opacity: 0.7 }} />
                ))}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Processing…</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '10px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--foreground)', marginBottom: '4px' }}>
                Drop a file here, or <span style={{ color: 'var(--ehl-gold)', textDecoration: 'underline' }}>browse</span>
              </p>
              <p style={{ fontSize: '12px', color: 'var(--muted)' }}>PDF or DOCX · Max 50MB</p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />

        {uploadStatus && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: uploadStatus.type === 'error' ? 'rgba(224,82,82,0.1)' : uploadStatus.type === 'success' ? 'rgba(76,175,125,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${uploadStatus.type === 'error' ? 'rgba(224,82,82,0.2)' : uploadStatus.type === 'success' ? 'rgba(76,175,125,0.2)' : 'var(--border)'}`,
              fontSize: '13px',
              color: statusColor,
            }}
          >
            {uploadStatus.msg}
          </div>
        )}
      </div>

      {/* Document list */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '14px', opacity: 0.7 }}>
          Uploaded Documents
        </h3>

        {loading ? (
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Loading…</p>
        ) : documents.length === 0 ? (
          <div
            style={{
              padding: '32px 20px',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.12)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            }}
          >
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>No documents uploaded for this section yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${doc.is_active ? 'rgba(201,168,76,0.25)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  opacity: doc.is_active ? 1 : 0.55,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '34px', height: '34px', flexShrink: 0,
                      borderRadius: '8px',
                      background: doc.is_active ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${doc.is_active ? 'rgba(201,168,76,0.2)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={doc.is_active ? 'var(--ehl-gold)' : 'var(--muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }} className="truncate">
                        {doc.filename}
                      </span>
                      {doc.is_active && (
                        <span
                          style={{
                            fontSize: '10px', fontWeight: 600,
                            background: 'rgba(76,175,125,0.15)',
                            color: '#4caf7d',
                            border: '1px solid rgba(76,175,125,0.2)',
                            borderRadius: '4px',
                            padding: '1px 7px',
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {new Date(doc.uploaded_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {doc.uploaded_by ? ` · ${doc.uploaded_by}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(doc.id, doc.storage_path)}
                  style={{
                    flexShrink: 0,
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px', borderRadius: '6px',
                    color: 'rgba(224,82,82,0.5)',
                    transition: 'color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#e05252'
                    e.currentTarget.style.background = 'rgba(224,82,82,0.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'rgba(224,82,82,0.5)'
                    e.currentTarget.style.background = 'none'
                  }}
                  title="Delete document"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
