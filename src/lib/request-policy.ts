// Framework-free request rules used by src/proxy.ts and the Payload REST route, kept separate for unit tests.

const MINUTE = 60_000

export const RATE_LIMIT_RULES = [
  { key: 'login', methods: ['POST'], match: (p: string) => p === '/api/users/login', limit: 10, windowMs: 15 * MINUTE },
  { key: 'forgot', methods: ['POST'], match: (p: string) => p === '/api/users/forgot-password', limit: 5, windowMs: 60 * MINUTE },
  { key: 'reset', methods: ['POST'], match: (p: string) => p === '/api/users/reset-password', limit: 10, windowMs: 15 * MINUTE },
  { key: 'first-register', methods: ['POST'], match: (p: string) => p === '/api/users/first-register', limit: 5, windowMs: 60 * MINUTE },
  { key: 'upload', methods: ['POST', 'PATCH'], match: (p: string) => p === '/api/media' || p.startsWith('/api/media/'), limit: 60, windowMs: 60 * MINUTE },
] as const

export function matchRateLimitRule(method: string, pathname: string) {
  return RATE_LIMIT_RULES.find((rule) => (rule.methods as readonly string[]).includes(method) && rule.match(pathname)) ?? null
}

const RESTORE_VERSION_PATH = /^\/api\/(?:globals\/)?[a-z0-9-]+\/versions\/[^/]+\/?$/

/**
 * Restoring a version must produce a draft for review (AC-12). Payload's REST restore publishes
 * when `draft` is not true, so every restore request is rewritten to draft=true.
 */
export function restoreAsDraftURL(method: string, url: URL): URL | null {
  if (method !== 'POST' || !RESTORE_VERSION_PATH.test(url.pathname)) return null
  if (url.searchParams.get('draft') === 'true') return null
  const rewritten = new URL(url)
  rewritten.searchParams.set('draft', 'true')
  return rewritten
}

export function isPrivatePath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/api/') ||
    pathname === '/preview' ||
    pathname.startsWith('/preview/')
  )
}
