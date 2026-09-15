import type { Payload } from 'payload'
import { ValidationError } from 'payload'
import { beforeEach, describe, expect, it } from 'vitest'

import { getProject, getProjectRedirect } from '@/lib/content/queries'
import { PUBLIC_MODE } from '@/lib/content/types'

import { getTestPayload, publishProject, resetDatabase } from '../helpers'

let payload: Payload

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
})

const publishSlug = (id: number, slug: string) =>
  payload.update({ collection: 'projects', id, data: { slug, _status: 'published' }, overrideAccess: true })

describe('slugs and redirects (TRD §9.5, AC-10)', () => {
  it('redirects old published URLs to the current slug, without chains', async () => {
    const project = await publishProject(payload, { slug: 'first-slug' })
    await publishSlug(project.id, 'second-slug')
    expect(await getProjectRedirect('first-slug')).toBe('/projects/second-slug')

    await publishSlug(project.id, 'third-slug')
    expect(await getProjectRedirect('first-slug')).toBe('/projects/third-slug')
    expect(await getProjectRedirect('second-slug')).toBe('/projects/third-slug')
  })

  it('does not loop when a project returns to an earlier slug', async () => {
    const project = await publishProject(payload, { slug: 'first-slug' })
    await publishSlug(project.id, 'second-slug')
    await publishSlug(project.id, 'first-slug')

    const redirects = await payload.find({ collection: 'redirects', overrideAccess: true })
    expect(redirects.docs.map((doc) => doc.fromPath)).toEqual(['/projects/second-slug'])
    expect((await getProject('first-slug', PUBLIC_MODE))?.id).toBe(project.id)
    expect(await getProjectRedirect('first-slug')).toBeNull()
    expect(await getProjectRedirect('second-slug')).toBe('/projects/first-slug')
  })

  it('blocks another project from taking a historical slug', async () => {
    const project = await publishProject(payload, { slug: 'first-slug' })
    await publishSlug(project.id, 'second-slug')

    await expect(
      payload.create({ collection: 'projects', data: { title: 'Hijack', slug: 'first-slug' } as never, draft: true, overrideAccess: true }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects duplicate slugs', async () => {
    await publishProject(payload, { slug: 'taken' })
    await expect(publishProject(payload, { slug: 'taken', title: 'Other' })).rejects.toBeInstanceOf(ValidationError)
  })

  it('does not redirect to an unpublished project', async () => {
    const project = await publishProject(payload, { slug: 'first-slug' })
    await publishSlug(project.id, 'second-slug')
    await payload.update({ collection: 'projects', id: project.id, data: { _status: 'draft' }, overrideAccess: true })
    expect(await getProjectRedirect('first-slug')).toBeNull()
  })

  it('does not create redirects for draft-only slug edits', async () => {
    const project = await publishProject(payload, { slug: 'live-slug' })
    await payload.update({ collection: 'projects', id: project.id, data: { slug: 'draft-slug' }, draft: true, overrideAccess: true })
    expect((await payload.count({ collection: 'redirects', overrideAccess: true })).totalDocs).toBe(0)
    expect((await getProject('live-slug', PUBLIC_MODE))?.id).toBe(project.id)
    expect(await getProject('draft-slug', PUBLIC_MODE)).toBeNull()
  })

  it('deletes a project together with its redirects', async () => {
    const project = await publishProject(payload, { slug: 'first-slug' })
    await publishSlug(project.id, 'second-slug')
    expect((await payload.count({ collection: 'redirects', overrideAccess: true })).totalDocs).toBe(1)

    await payload.delete({ collection: 'projects', id: project.id, overrideAccess: true })
    expect((await payload.count({ collection: 'redirects', overrideAccess: true })).totalDocs).toBe(0)
    expect(await getProjectRedirect('first-slug')).toBeNull()
  })

  it('rejects reserved slugs on publish', async () => {
    await expect(publishProject(payload, { slug: 'admin' })).rejects.toBeInstanceOf(ValidationError)
  })
})
