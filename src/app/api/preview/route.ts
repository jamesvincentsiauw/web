import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { isAdminUser } from '@/access'
import type { User } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { parsePreviewParams, previewPath } from '@/lib/preview'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }

export async function GET(request: Request) {
  const target = parsePreviewParams(new URL(request.url).searchParams)
  if (!target) return new Response('Invalid preview target.', { status: 400, headers: NO_STORE })

  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) {
    return new Response('Sign in to the CMS to preview drafts.', { status: 401, headers: NO_STORE })
  }

  if (target.kind === 'collection') {
    const doc = await payload.findByID({
      collection: target.collection,
      id: target.id,
      draft: true,
      depth: 0,
      overrideAccess: false,
      user: user as User,
      disableErrors: true,
    })
    if (!doc) return new Response('Preview target not found.', { status: 404, headers: NO_STORE })
  }

  ;(await draftMode()).enable()
  redirect(previewPath(target))
}
