import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'
import { auth } from '@/auth'

// next-auth's `auth` export is typed via a rest-tuple union (NextApiRequest, GetServerSidePropsContext, etc.)
// that TS can't resolve against a plain (request, event) call; narrow it to the proxy-shaped overload it's actually used as.
const adminAuth = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent
) => Promise<Response | undefined> | Response | undefined

const locales = ['ro', 'ru', 'en'] as const
type Locale = typeof locales[number]
const defaultLocale: Locale = 'ro'

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return adminAuth(request, event)
  }

  const segments = pathname.split('/')
  const maybeLocale = segments[1]

  if (isLocale(maybeLocale)) {
    const rest = '/' + segments.slice(2).join('/')

    if (maybeLocale === defaultLocale) {
      const url = request.nextUrl.clone()
      url.pathname = rest
      return NextResponse.redirect(url, 301)
    }

    const url = request.nextUrl.clone()
    url.pathname = rest
    const res = NextResponse.rewrite(url)
    res.cookies.set('locale', maybeLocale, { path: '/', maxAge: 31536000, sameSite: 'lax' })
    return res
  }

  const res = NextResponse.next()
  res.cookies.set('locale', defaultLocale, { path: '/', maxAge: 31536000, sameSite: 'lax' })
  return res
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
}
