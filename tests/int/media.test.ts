import type { Payload } from 'payload'
import { beforeEach, describe, expect, it } from 'vitest'

import { GET as mediaRoute } from '@/app/media/[id]/route'
import { getProfile, getProject } from '@/lib/content/queries'
import { PUBLIC_MODE } from '@/lib/content/types'
import type { User } from '@/payload-types'

import {
  MINIMAL_PDF,
  PNG_1PX,
  createAdmin,
  createPublicImage,
  fileUpload,
  getTestPayload,
  publishProject,
  resetDatabase,
  rest,
  richTextWithUpload,
} from '../helpers'

let payload: Payload
let admin: { user: User; token: string }

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  admin = await createAdmin(payload)
})

async function fetchMedia(id: number, token?: string) {
  const request = new Request(`http://localhost:3000/media/${id}`, { headers: token ? { Authorization: `JWT ${token}` } : {} })
  const response = await mediaRoute(request, { params: Promise.resolve({ id: String(id) }) })
  return { status: response.status, headers: response.headers, body: Buffer.from(await response.arrayBuffer()) }
}

describe('uploads (TRD §3 Media, §9.7)', () => {
  it('rejects disallowed types, spoofed content, double extensions, and oversized files', async () => {
    const attempts = [
      fileUpload('logo.svg', 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),
      fileUpload('page.html', 'text/html', Buffer.from('<script>alert(1)</script>')),
      fileUpload('fake.png', 'image/png', MINIMAL_PDF),
      fileUpload('shell.php.png', 'image/png', PNG_1PX),
      fileUpload('huge.png', 'image/png', Buffer.concat([PNG_1PX, Buffer.alloc(8 * 1024 * 1024)])),
    ]
    for (const file of attempts) {
      await expect(
        payload.create({ collection: 'media', data: { alt: 'x' } as never, file, overrideAccess: true }),
        file.name,
      ).rejects.toThrow()
    }
    expect((await payload.count({ collection: 'media', overrideAccess: true })).totalDocs).toBe(0)
  })

  it('requires alt text for images unless marked decorative', async () => {
    await expect(
      payload.create({ collection: 'media', data: {} as never, file: fileUpload('dot.png', 'image/png', PNG_1PX), overrideAccess: true }),
    ).rejects.toThrow()
    const decorative = await payload.create({
      collection: 'media',
      data: { decorative: true } as never,
      file: fileUpload('dot.png', 'image/png', PNG_1PX),
      overrideAccess: true,
    })
    expect(decorative.kind).toBe('image')
  })

  it('stores uploads under opaque names, private by default, and keeps anonymous REST out', async () => {
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'A dot' } as never,
      file: fileUpload('My Photo.png', 'image/png', PNG_1PX),
      overrideAccess: true,
    })
    expect(media.filename).toMatch(/^[0-9a-f-]{36}\.png$/)
    expect(media.downloadName).toBe('My_Photo.png')
    expect(media.visibility).toBe('private')

    const file = await rest('GET', `/api/media/file/${media.filename}`)
    expect([401, 403, 404]).toContain(file.status)
    expect((await fetchMedia(media.id)).status).toBe(404)
    expect((await fetchMedia(media.id, admin.token)).status).toBe(200)
  })
})

describe('media delivery (TRD §5, §9.3)', () => {
  it('serves a file only when public, ready, and referenced by published content', async () => {
    const image = await createPublicImage(payload)
    expect((await fetchMedia(image.id)).status).toBe(404) // public + ready but unreferenced

    const draft = await payload.create({
      collection: 'projects',
      data: { title: 'Draft with cover', slug: 'draft-cover', cover: image.id } as never,
      draft: true,
      overrideAccess: true,
    })
    expect((await fetchMedia(image.id)).status).toBe(404) // referenced by a draft only

    await payload.update({
      collection: 'projects',
      id: draft.id,
      data: {
        _status: 'published',
        summary: 'Summary',
        category: 'research',
        projectType: 'academic',
        role: 'Author',
        context: richTextWithUpload(image.id),
        contribution: richTextWithUpload(image.id),
        decisions: richTextWithUpload(image.id),
        outcome: richTextWithUpload(image.id),
        contentReady: true,
      } as never,
      overrideAccess: true,
    })
    const served = await fetchMedia(image.id)
    expect(served.status).toBe(200)
    expect(served.headers.get('content-type')).toBe('image/png')
    expect(served.headers.get('cache-control')).toBe('no-store')
    expect(served.body.equals(PNG_1PX)).toBe(true)

    const dto = await getProject('draft-cover', PUBLIC_MODE)
    expect(dto?.cover?.url).toBe(`/media/${image.id}`)
    expect(dto?.richTextMedia[image.id]?.alt).toBe('A single dot')
  })

  it('keeps shared media available when one referencing project is unpublished', async () => {
    const image = await createPublicImage(payload)
    const first = await publishProject(payload, { slug: 'first', cover: image.id })
    const second = await publishProject(payload, { slug: 'second', title: 'Second', cover: image.id })
    expect((await fetchMedia(image.id)).status).toBe(200)

    await payload.update({ collection: 'projects', id: first.id, data: { _status: 'draft' }, overrideAccess: true })
    expect((await fetchMedia(image.id)).status).toBe(200)

    await payload.update({ collection: 'projects', id: second.id, data: { _status: 'draft' }, overrideAccess: true })
    expect((await fetchMedia(image.id)).status).toBe(404)
  })

  it('stops serving a file when it is made private again', async () => {
    const image = await createPublicImage(payload)
    await publishProject(payload, { cover: image.id })
    expect((await fetchMedia(image.id)).status).toBe(200)
    await payload.update({ collection: 'media', id: image.id, data: { visibility: 'private' }, overrideAccess: true })
    expect((await fetchMedia(image.id)).status).toBe(404)
    expect((await getProject('workflow-builder', PUBLIC_MODE))?.cover).toBeNull()
  })

  it('refuses to publish a project whose cover is private', async () => {
    const image = await createPublicImage(payload, { visibility: 'private' })
    await expect(publishProject(payload, { cover: image.id })).rejects.toThrow()
  })

  it('exposes the CV only after it is public and referenced by the published profile (AC-09)', async () => {
    const cv = await payload.create({
      collection: 'media',
      data: { visibility: 'public', contentReady: true, downloadName: 'Vincent-Siauw-CV.pdf' } as never,
      file: fileUpload('cv.pdf', 'application/pdf', MINIMAL_PDF),
      overrideAccess: true,
    })
    const profile = {
      displayName: 'Vincent Siauw',
      roleLabel: 'Software Engineer',
      heroHeading: 'Heading',
      heroIntro: 'Intro',
      email: 'person@example.test',
      contentReady: true,
    }

    await payload.updateGlobal({ slug: 'profile', data: { ...profile, _status: 'published' } as never, overrideAccess: true })
    expect((await getProfile(PUBLIC_MODE))?.resume).toBeNull()
    expect((await fetchMedia(cv.id)).status).toBe(404)

    await payload.updateGlobal({ slug: 'profile', data: { ...profile, resume: cv.id, _status: 'published' } as never, overrideAccess: true })
    const resume = (await getProfile(PUBLIC_MODE))?.resume
    expect(resume?.mimeType).toBe('application/pdf')
    expect(resume?.sizeLabel).toMatch(/KB$/)

    const request = new Request(`http://localhost:3000/media/${cv.id}?download=1`)
    const response = await mediaRoute(request, { params: Promise.resolve({ id: String(cv.id) }) })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toContain('attachment; filename="Vincent-Siauw-CV.pdf"')

    // A draft profile edit that removes the CV does not affect the published snapshot.
    await payload.updateGlobal({ slug: 'profile', data: { resume: null } as never, draft: true, overrideAccess: true })
    expect((await fetchMedia(cv.id)).status).toBe(200)
  })
})
