import { isSafeInternalPath } from './validation'

export type ParsedPreviewTarget =
  | { kind: 'collection'; collection: 'projects' | 'experiences' | 'skills' | 'education'; id: number }
  | { kind: 'global'; global: 'profile' | 'site-settings' }

const PREVIEW_COLLECTIONS = new Set(['projects', 'experiences', 'skills', 'education'])
const PREVIEW_GLOBALS = new Set(['profile', 'site-settings'])

/** Allowlisted preview targets only. Anything else, including redirect URLs, is rejected. */
export function parsePreviewParams(params: URLSearchParams): ParsedPreviewTarget | null {
  const allowedKeys = new Set(['collection', 'id', 'global'])
  for (const key of params.keys()) if (!allowedKeys.has(key)) return null

  const collection = params.get('collection')
  const global = params.get('global')
  if (collection && !global) {
    const id = params.get('id')
    if (!PREVIEW_COLLECTIONS.has(collection) || !id || !/^\d{1,12}$/.test(id)) return null
    return { kind: 'collection', collection: collection as 'projects', id: Number(id) }
  }
  if (global && !collection && !params.has('id')) {
    if (!PREVIEW_GLOBALS.has(global)) return null
    return { kind: 'global', global: global as 'profile' }
  }
  return null
}

export function previewPath(target: ParsedPreviewTarget): string {
  if (target.kind === 'global') return '/'
  if (target.collection === 'projects') return `/preview/projects/${target.id}`
  return '/about'
}

const NON_PUBLIC_PREFIXES = ['/api', '/admin', '/preview', '/media']

/** Exit preview returns to a valid public route; anything suspicious falls back to the homepage. */
export function safeExitPath(value: string | null): string {
  if (!isSafeInternalPath(value)) return '/'
  const pathname = value.split(/[?#]/)[0]
  if (NON_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return '/'
  return value
}
