import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { GET as previewRoute } from '@/app/api/preview/route'
import { getProjectForPreview } from '@/lib/content/queries'
import { PUBLIC_MODE } from '@/lib/content/types'
import type { User } from '@/payload-types'

import { createAdmin, getTestPayload, resetDatabase } from '../helpers'

let payload: Payload
let admin: { user: User; token: string }

beforeAll(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  admin = await createAdmin(payload)
})

describe('preview (TRD §5 Preview, §9.4)', () => {
  it('requires an admin session', async () => {
    const response = await previewRoute(new Request('http://localhost:3000/api/preview?collection=projects&id=1'))
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
  })

  it('rejects invalid targets and external redirect parameters before authentication', async () => {
    for (const query of ['collection=users&id=1', 'collection=projects&id=1&redirect=https://evil.test', 'global=../../etc']) {
      const response = await previewRoute(new Request(`http://localhost:3000/api/preview?${query}`, { headers: { Authorization: `JWT ${admin.token}` } }))
      expect(response.status, query).toBe(400)
    }
  })

  it('returns 404 for a missing preview target', async () => {
    const response = await previewRoute(
      new Request('http://localhost:3000/api/preview?collection=projects&id=999999', { headers: { Authorization: `JWT ${admin.token}` } }),
    )
    expect(response.status).toBe(404)
  })

  it('serves drafts only to an authenticated preview reader', async () => {
    const draft = await payload.create({ collection: 'projects', data: { title: 'Preview draft' } as never, draft: true, overrideAccess: true })
    expect(await getProjectForPreview(draft.id, PUBLIC_MODE)).toBeNull()
    expect(await getProjectForPreview(draft.id, { draft: true, user: null })).toBeNull()
    expect((await getProjectForPreview(draft.id, { draft: true, user: admin.user }))?.title).toBe('Preview draft')
  })
})
