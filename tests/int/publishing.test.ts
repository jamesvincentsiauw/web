import type { Payload } from 'payload'
import { ValidationError } from 'payload'
import { beforeEach, describe, expect, it } from 'vitest'

import { getExperiences, getHomeProjects, getProject, getProjectForPreview, getSitemapProjects, listProjects } from '@/lib/content/queries'
import { PUBLIC_MODE } from '@/lib/content/types'
import type { User } from '@/payload-types'

import { createAdmin, getTestPayload, publishProject, resetDatabase, rest } from '../helpers'

let payload: Payload
let admin: { user: User; token: string }

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  admin = await createAdmin(payload)
})

async function validationPaths(promise: Promise<unknown>): Promise<string[]> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ValidationError) return error.data.errors.map((item) => item.path)
    throw error
  }
  throw new Error('Expected a validation error')
}

describe('draft and publish lifecycle (TRD §5, §9.2, §9.3, §9.6)', () => {
  it('saves incomplete drafts but rejects publishing incomplete content', async () => {
    const draft = await payload.create({ collection: 'projects', data: { title: 'Only a title' } as never, draft: true, overrideAccess: true })
    expect(draft._status).toBe('draft')

    const paths = await validationPaths(
      payload.update({ collection: 'projects', id: draft.id, data: { _status: 'published' }, overrideAccess: true }),
    )
    expect(paths).toEqual(expect.arrayContaining(['summary', 'category', 'role', 'context', 'contribution', 'decisions', 'outcome', 'contentReady']))
    expect(await getProject(draft.slug, PUBLIC_MODE)).toBeNull()
  })

  it('keeps the published version public while a draft edit is pending, then replaces it on publish (AC-04)', async () => {
    const project = await publishProject(payload, { title: 'Original title' })
    await payload.update({ collection: 'projects', id: project.id, data: { title: 'Pending edit' }, draft: true, overrideAccess: true })

    expect((await getProject('workflow-builder', PUBLIC_MODE))?.title).toBe('Original title')
    expect((await rest('GET', '/api/projects')).text).not.toContain('Pending edit')
    expect((await getProjectForPreview(project.id, { draft: true, user: admin.user }))?.title).toBe('Pending edit')

    await payload.update({ collection: 'projects', id: project.id, data: { title: 'Pending edit', _status: 'published' }, overrideAccess: true })
    expect((await getProject('workflow-builder', PUBLIC_MODE))?.title).toBe('Pending edit')
  })

  it('unpublish removes the project from list, detail, sitemap, and home (AC-05)', async () => {
    const project = await publishProject(payload)
    expect(await getSitemapProjects()).toHaveLength(1)

    await payload.update({ collection: 'projects', id: project.id, data: { _status: 'draft' }, overrideAccess: true })

    expect(await getProject('workflow-builder', PUBLIC_MODE)).toBeNull()
    expect((await listProjects({}, PUBLIC_MODE)).totalDocs).toBe(0)
    expect(await getSitemapProjects()).toHaveLength(0)
    expect((await getHomeProjects(PUBLIC_MODE)).items).toHaveLength(0)
  })

  it('restores versions as drafts only and never publishes them (AC-12)', async () => {
    const project = await publishProject(payload, { title: 'Version one' })
    await payload.update({ collection: 'projects', id: project.id, data: { title: 'Version two', _status: 'published' }, overrideAccess: true })

    const versions = await payload.findVersions({ collection: 'projects', where: { parent: { equals: project.id } }, sort: 'createdAt', overrideAccess: true })
    const versionOne = versions.docs.find((version) => version.version.title === 'Version one')!

    // Local API cannot request a draft restore, so it is refused instead of publishing.
    await expect(payload.restoreVersion({ collection: 'projects', id: versionOne.id, overrideAccess: true })).rejects.toThrow(/restored as drafts/)
    // The app's REST route forces draft=true, so a plain "Restore" (no draft param) still creates a draft.
    const restored = await rest('POST', `/api/projects/versions/${versionOne.id}`, { token: admin.token })
    expect(restored.status).toBe(200)
    expect((await getProject('workflow-builder', PUBLIC_MODE))?.title).toBe('Version two')
    const latest = await payload.findByID({ collection: 'projects', id: project.id, draft: true, overrideAccess: true })
    expect(latest.title).toBe('Version one')
    expect(latest._status).toBe('draft')
  })

  it('allows at most three featured published projects', async () => {
    for (const slug of ['one', 'two', 'three']) await publishProject(payload, { slug, featured: true })
    const paths = await validationPaths(publishProject(payload, { slug: 'four', featured: true }))
    expect(paths).toContain('featured')

    // Saving a featured draft is allowed; only publishing is guarded.
    const draft = await payload.create({ collection: 'projects', data: { title: 'Draft five', featured: true } as never, draft: true, overrideAccess: true })
    expect(draft.featured).toBe(true)
  })

  it('orders projects by sortOrder, then ID, and falls back to the first three when none are featured (AC-06)', async () => {
    const a = await publishProject(payload, { slug: 'a', title: 'A', sortOrder: 20 })
    const b = await publishProject(payload, { slug: 'b', title: 'B', sortOrder: 10 })
    const c = await publishProject(payload, { slug: 'c', title: 'C', sortOrder: 10 })
    const d = await publishProject(payload, { slug: 'd', title: 'D', sortOrder: 30 })

    expect((await listProjects({}, PUBLIC_MODE)).items.map((item) => item.id)).toEqual([b.id, c.id, a.id, d.id])
    expect((await getHomeProjects(PUBLIC_MODE)).items.map((item) => item.id)).toEqual([b.id, c.id, a.id])

    await payload.update({ collection: 'projects', id: d.id, data: { featured: true, _status: 'published' }, overrideAccess: true })
    const home = await getHomeProjects(PUBLIC_MODE)
    expect(home.items.map((item) => item.id)).toEqual([d.id])
    expect(home.total).toBe(4)
  })

  it('validates months on publish', async () => {
    const paths = await validationPaths(publishProject(payload, { startMonth: '2024-10', endMonth: '2023-01' }))
    expect(paths).toContain('endMonth')
    expect(await validationPaths(publishProject(payload, { slug: 'bad-month', startMonth: '2024-13' }))).toContain('startMonth')
  })

  it('validates current and past engagements and keeps concurrent experiences readable', async () => {
    const invalid = payload.create({
      collection: 'experiences',
      data: {
        organization: 'Current Co',
        contentReady: true,
        _status: 'published',
        engagements: [{ role: 'Engineer', employmentType: 'full-time', startMonth: '2024-10' }],
      } as never,
      overrideAccess: true,
    })
    expect((await validationPaths(invalid)).some((path) => path.includes('endMonth'))).toBe(true)

    await payload.create({
      collection: 'experiences',
      data: {
        organization: 'Offerland Technologies',
        sortOrder: 20,
        contentReady: true,
        _status: 'published',
        engagements: [
          { role: 'Backend Engineer', employmentType: 'full-time', startMonth: '2022-01', endMonth: '2024-10' },
          { role: 'Backend Engineer', employmentType: 'freelance', startMonth: '2020-06', endMonth: '2022-01' },
        ],
      } as never,
      overrideAccess: true,
    })
    await payload.create({
      collection: 'experiences',
      data: {
        organization: 'Tokopedia',
        sortOrder: 30,
        contentReady: true,
        _status: 'published',
        engagements: [
          {
            role: 'Software Engineer',
            employmentType: 'full-time',
            startMonth: '2021-10',
            endMonth: '2022-01',
            overlapNote: 'Concurrent with Offerland freelance engagement',
          },
        ],
      } as never,
      overrideAccess: true,
    })
    await payload.create({
      collection: 'experiences',
      data: {
        organization: 'Jobkred',
        sortOrder: 10,
        contentReady: true,
        _status: 'published',
        engagements: [{ role: 'Software Engineer, Full Stack', employmentType: 'full-time', startMonth: '2024-10', isCurrent: true }],
      } as never,
      overrideAccess: true,
    })

    const experiences = await getExperiences(PUBLIC_MODE)
    expect(experiences.map((item) => item.organization)).toEqual(['Jobkred', 'Offerland Technologies', 'Tokopedia'])
    expect(experiences[0].engagements[0].period).toBe('Oct 2024 – Present')
    expect(experiences[1].engagements.map((item) => item.employmentTypeLabel)).toEqual(['Full-time', 'Freelance'])
    expect(experiences[2].engagements[0].overlapNote).toBe('Concurrent with Offerland freelance engagement')
  })
})
