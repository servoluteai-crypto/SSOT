'use client'

interface PdfViewerModalProps {
  url: string
  onClose: () => void
}

export function PdfViewerModal({ url, onClose }: PdfViewerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] mx-4 my-4 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-light tracking-wide">Document Viewer</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF iframe */}
        <div className="flex-1">
          <iframe
            src={url}
            className="w-full h-full"
            title="Document viewer"
          />
        </div>
      </div>
    </div>
  )
}
