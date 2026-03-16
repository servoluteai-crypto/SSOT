export default function OnboardingHubPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <a
          href="/operations"
          className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-12"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back to Operations</span>
        </a>

        <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <h1 className="text-2xl font-light tracking-wider text-white mb-3">
          Onboarding Hub
        </h1>
        <div className="w-8 h-px bg-accent mx-auto mb-6" />
        <p className="text-muted text-sm leading-relaxed max-w-sm mx-auto">
          The Onboarding Hub is coming soon. This will be your go-to space for
          training videos, guides, and onboarding resources tailored to your role.
        </p>
      </div>
    </main>
  )
}
