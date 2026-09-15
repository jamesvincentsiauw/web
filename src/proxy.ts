import { NextResponse, type NextRequest } from 'next/server'

import { consumeRateLimit } from './lib/rate-limit'
import { isPrivatePath, matchRateLimitRule } from './lib/request-policy'

const DRAFT_MODE_COOKIE = '__prerender_bypass'

function clientKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const rule = matchRateLimitRule(request.method, pathname)
  if (rule && !consumeRateLimit(`${rule.key}:${clientKey(request)}`, rule.limit, rule.windowMs)) {
    return NextResponse.json(
      { errors: [{ message: 'Too many requests. Please wait and try again.' }] },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rule.windowMs / 1000)), 'Cache-Control': 'no-store' } },
    )
  }

  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  const inPreview = request.cookies.has(DRAFT_MODE_COOKIE)
  if (isPrivatePath(pathname) || inPreview) {
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  } else {
    // Public HTML and media authorization are rendered per request without a shared cache (TRD §5).
    response.headers.set('Cache-Control', 'no-store')
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
