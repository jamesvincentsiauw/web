const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Canonical origin from the environment (TRD §3 Site Settings, §6). Never taken from CMS input.
 * Production refuses a localhost origin unless ALLOW_LOCALHOST_ORIGIN=true (used for local
 * production builds such as Lighthouse runs).
 */
export function getServerURL(): string {
  const raw = process.env.SERVER_URL
  const isProduction = process.env.NODE_ENV === 'production'

  if (!raw) {
    // On Vercel, fall back to the deployment's own origin: preview deployments use their unique
    // URL (so admin login/CSRF work there), production uses the project's production domain.
    if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    if (isProduction && process.env.ALLOW_LOCALHOST_ORIGIN !== 'true') {
      throw new Error('SERVER_URL must be set in production.')
    }
    return 'http://localhost:3000'
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('SERVER_URL is not a valid URL.')
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('SERVER_URL must use http or https.')
  }
  if (isProduction && LOCAL_HOSTS.has(url.hostname) && process.env.ALLOW_LOCALHOST_ORIGIN !== 'true') {
    throw new Error('SERVER_URL must not be localhost in production.')
  }
  return url.origin
}

export function absoluteURL(path: string): string {
  return new URL(path, getServerURL()).toString()
}
