import { NextRequest, NextResponse } from 'next/server'

const SID_COOKIE = 'sid'
const ONE_YEAR = 60 * 60 * 24 * 365

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const existing = req.cookies.get(SID_COOKIE)
  console.log('[mw]', req.nextUrl.pathname, 'sid=', existing?.value?.slice(0, 8) ?? 'NONE')
  if (!existing) {
    const sid = crypto.randomUUID()
    res.cookies.set(SID_COOKIE, sid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ONE_YEAR,
      path: '/',
    })
    console.log('[mw] set new sid=', sid.slice(0, 8))
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
