import { isAdminUser } from '@/access'
import { findPubliclyAvailableMedia } from '@/lib/content/media'
import { getPayloadClient } from '@/lib/payload'
import { objectKey, readStoredFile } from '@/lib/storage'
import { safeDownloadName } from '@/lib/validation'

export const dynamic = 'force-dynamic'

const notFound = () =>
  new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })

function contentDisposition(type: 'inline' | 'attachment', name: string) {
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, '_')
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  if (!/^\d{1,12}$/.test(rawId)) return notFound()
  const id = Number(rawId)

  let media = await findPubliclyAvailableMedia(id)
  const isPublic = Boolean(media)

  if (!media) {
    // Draft-only and private files: authenticated admins (CMS and draft preview) only.
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: request.headers })
    if (!isAdminUser(user)) return notFound()
    media = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true, disableErrors: true })
    if (!media) return notFound()
  }

  const key = objectKey(media)
  if (!key || !media.mimeType) return notFound()

  const file = await readStoredFile(key)
  if (!file) return notFound()

  const extension = media.mimeType === 'application/pdf' ? 'pdf' : (media.filename?.split('.').pop() ?? 'bin')
  const downloadName = media.downloadName ? safeDownloadName(media.downloadName, extension) : `file-${media.id}.${extension}`
  const wantsDownload = new URL(request.url).searchParams.get('download') === '1'

  const headers = new Headers({
    'Content-Type': media.mimeType,
    'Cache-Control': isPublic ? 'no-store' : 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': contentDisposition(wantsDownload ? 'attachment' : 'inline', downloadName),
  })
  if (file.contentLength !== undefined) headers.set('Content-Length', String(file.contentLength))
  if (!isPublic) headers.set('X-Robots-Tag', 'noindex, nofollow')

  return new Response(file.body, { status: 200, headers })
}
