import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const STAFF_PROTECTED = ['/hr', '/operations', '/reviews']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin routes → Supabase Auth
  if (pathname.startsWith('/admin')) {
    return await updateSession(request)
  }

  // Staff routes → PIN cookie check
  const isProtected = STAFF_PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (isProtected) {
    const cookie = request.cookies.get('ehl_staff_auth')
    if (!cookie || cookie.value !== 'authenticated') {
      const url = request.nextUrl.clone()
      url.pathname = '/staff-login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/hr',
    '/hr/:path*',
    '/operations',
    '/operations/:path*',
    '/reviews',
    '/reviews/:path*',
  ],
}
