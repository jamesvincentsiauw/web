import { getServerURL } from './env'

export type PreviewTarget =
  | { collection: 'projects' | 'experiences' | 'skills' | 'education'; id: number | string }
  | { global: 'profile' | 'site-settings' }

/** Builds the admin "Preview" button URL. Authorization happens in /api/preview, not here. */
export function previewURL(target: PreviewTarget): string {
  const url = new URL('/api/preview', getServerURL())
  if ('collection' in target) {
    url.searchParams.set('collection', target.collection)
    url.searchParams.set('id', String(target.id))
  } else {
    url.searchParams.set('global', target.global)
  }
  return url.toString()
}
