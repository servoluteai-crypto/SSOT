'use client'

import Link from 'next/link'
import { getSectionsByParent } from '../../../config/sections'

export default function OperationsPage() {
  const subSections = getSectionsByParent('operations')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </a>
          <h1 className="text-2xl font-light tracking-wider text-white">Operations</h1>
          <div className="w-8 h-px bg-accent mt-3" />
        </div>

        {/* Sub-section tiles */}
        <div className="space-y-3">
          {subSections.map((sub) => {
            if (sub.status === 'coming-soon') {
              return (
                <div
                  key={sub.id}
                  className="w-full p-5 rounded-lg bg-card border border-border opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-light tracking-wide">{sub.label}</span>
                    <span className="text-xs text-muted uppercase tracking-wider">Coming Soon</span>
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={sub.id}
                href={`/operations/${sub.id}`}
                className="block w-full p-5 rounded-lg bg-card border border-border hover:border-accent/50 hover:bg-card-hover transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-light tracking-wide">{sub.label}</span>
                  <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
