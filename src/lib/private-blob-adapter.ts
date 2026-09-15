import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { del, put } from '@vercel/blob'

import { readStoredFile } from './storage'

/**
 * Payload storage adapter for a *private* Vercel Blob store. The official
 * @payloadcms/storage-vercel-blob adapter only supports public blobs, which would expose files at
 * public URLs and bypass the /media/[id] access check (TRD §5).
 */
export function privateVercelBlobAdapter({ token }: { token: string }): Adapter {
  return ({ prefix = '' }) => {
    const keyFor = (filename: string, docPrefix?: string) => getFileKey({ collectionPrefix: prefix, docPrefix, filename }).fileKey

    return {
      name: 'vercel-blob-private',
      handleUpload: async ({ data, file }) => {
        await put(keyFor(file.filename, data.prefix), file.buffer, {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: file.mimeType,
          token,
        })
        return data
      },
      handleDelete: async ({ doc, filename }) => {
        await del(keyFor(filename, doc.prefix), { token })
      },
      // Serves /api/media/file/* after Payload's own read access check (admins only).
      staticHandler: async (_req, { params }) => {
        const file = await readStoredFile(keyFor(params.filename, params.prefix))
        if (!file) return new Response('Not found', { status: 404 })
        const headers = new Headers({
          'Content-Type': file.contentType ?? 'application/octet-stream',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        })
        if (file.contentLength !== undefined) headers.set('Content-Length', String(file.contentLength))
        return new Response(file.body, { headers })
      },
    }
  }
}
