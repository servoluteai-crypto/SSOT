'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/admin/documents',
    label: 'Documents',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>
      </svg>
    ),
  },
  {
    href: '/admin/prompts',
    label: 'Prompts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/admin/escalation',
    label: 'Escalation',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17"/>
      </svg>
    ),
  },
]

function NavItem({ item, isActive }: { item: typeof navItems[0]; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '13.5px',
        fontWeight: isActive ? 500 : 400,
        color: isActive ? 'var(--ehl-gold)' : 'rgba(240,237,230,0.5)',
        background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
        borderLeft: `2px solid ${isActive ? 'var(--ehl-gold)' : 'transparent'}`,
        textDecoration: 'none',
        transition: 'all 0.15s',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.color = '#f0ede6'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.color = 'rgba(240,237,230,0.5)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
      {item.label}
    </Link>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Login page — no chrome
  if (pathname === '/admin') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin')
  }

  const currentPage = navItems.find((n) => n.href === pathname)?.label || 'Admin'

  return (
    <div
      className="admin-theme min-h-screen flex"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0"
        style={{
          width: '228px',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '26px 20px 22px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <img src="/logo.svg" alt="EHL Experiences" style={{ width: '130px', height: 'auto' }} />
          <div
            style={{
              marginTop: '10px',
              fontSize: '10px',
              color: 'var(--muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Admin Panel
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div
            style={{
              fontSize: '10px',
              color: 'var(--muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '8px 14px 6px',
              fontWeight: 500,
            }}
          >
            Management
          </div>
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} isActive={pathname === item.href} />
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
          <a
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 14px', borderRadius: '8px',
              fontSize: '13px', color: 'rgba(240,237,230,0.4)',
              textDecoration: 'none', transition: 'color 0.15s',
              marginBottom: '4px',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0ede6'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,237,230,0.4)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            View App
          </a>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '9px 14px', borderRadius: '8px',
              fontSize: '13px', color: 'rgba(240,237,230,0.4)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#e05252'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,237,230,0.4)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="EHL" style={{ width: '90px', height: 'auto' }} />
            <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin</span>
          </div>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            style={{ color: 'var(--foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            {mobileNavOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {mobileNavOpen && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px 12px' }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', borderRadius: '8px',
                  fontSize: '14px',
                  color: pathname === item.href ? 'var(--ehl-gold)' : 'rgba(240,237,230,0.6)',
                  background: pathname === item.href ? 'rgba(201,168,76,0.1)' : 'transparent',
                  textDecoration: 'none', marginBottom: '2px',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px' }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '11px 14px', borderRadius: '8px',
                  fontSize: '14px', color: 'rgba(240,237,230,0.4)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <main
        className="flex-1 min-w-0"
        style={{ padding: '36px 32px', overflowY: 'auto' }}
      >
        {/* Mobile top spacing */}
        <div className="md:hidden" style={{ height: '64px' }} />

        {/* Page header */}
        <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <h1
            className="font-serif"
            style={{ fontSize: '24px', fontWeight: 500, color: 'var(--foreground)', letterSpacing: '0.01em' }}
          >
            {currentPage}
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '3px' }}>
            EHL Experiences — Admin
          </p>
        </div>

        <div className="max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  )
}
