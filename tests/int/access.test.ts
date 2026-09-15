import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { getProfile, getProject, listProjects } from '@/lib/content/queries'
import { PUBLIC_MODE } from '@/lib/content/types'
import type { User } from '@/payload-types'

import { completeProject, createAdmin, getTestPayload, publishProject, resetDatabase, rest, richText } from '../helpers'

let payload: Payload
let admin: { user: User; token: string }

beforeAll(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  admin = await createAdmin(payload)
})

describe('anonymous access (TRD §9.1, AC-03)', () => {
  it('cannot read a draft project through any REST variant', async () => {
    const draft = await payload.create({
      collection: 'projects',
      data: { title: 'Secret draft title', slug: 'secret-draft' } as never,
      draft: true,
      overrideAccess: true,
    })
    const paths = [
      '/api/projects',
      '/api/projects?draft=true',
      `/api/projects/${draft.id}`,
      `/api/projects/${draft.id}?draft=true`,
      '/api/projects?where[slug][equals]=secret-draft&draft=true',
      '/api/projects/versions',
      `/api/projects/versions?where[parent][equals]=${draft.id}`,
    ]
    for (const path of paths) {
      const response = await rest('GET', path)
      expect(response.text, path).not.toContain('Secret draft title')
    }
    expect(await getProject('secret-draft', PUBLIC_MODE)).toBeNull()
    expect((await listProjects({}, PUBLIC_MODE)).items).toHaveLength(0)
  })

  it('cannot read a pending draft edit of a published project via draft=true', async () => {
    const project = await publishProject(payload, { title: 'Published title', slug: 'published-then-edited' })
    await payload.update({ collection: 'projects', id: project.id, data: { title: 'Unpublished edit' }, draft: true, overrideAccess: true })

    for (const path of [`/api/projects/${project.id}?draft=true`, '/api/projects?draft=true']) {
      const response = await rest('GET', path)
      expect(response.text, path).not.toContain('Unpublished edit')
    }
    const adminView = await rest('GET', `/api/projects/${project.id}?draft=true`, { token: admin.token })
    expect(adminView.text).toContain('Unpublished edit')
  })

  it('cannot read users, media, redirects, or global versions', async () => {
    for (const path of ['/api/users', '/api/media', '/api/redirects', '/api/globals/profile/versions', '/api/users/me']) {
      const response = await rest('GET', path)
      expect(response.text, path).not.toContain(admin.user.email)
      if (path !== '/api/users/me') expect([401, 403], path).toContain(response.status)
    }
  })

  it('never receives internal fields on published projects', async () => {
    await publishProject(payload, {
      slug: 'with-internal-notes',
      internalNotes: 'INTERNAL-NOTES-MARKER',
      internalSource: 'INTERNAL-SOURCE-MARKER',
      metrics: [{ valueText: '2x', label: 'Throughput', context: 'Measured in staging', sourceNote: 'SOURCE-NOTE-MARKER' }],
    })
    const response = await rest('GET', '/api/projects?depth=2')
    expect(response.status).toBe(200)
    for (const marker of ['INTERNAL-NOTES-MARKER', 'INTERNAL-SOURCE-MARKER', 'SOURCE-NOTE-MARKER', 'mediaRefs']) {
      expect(response.text).not.toContain(marker)
    }
    const dto = await getProject('with-internal-notes', PUBLIC_MODE)
    expect(JSON.stringify(dto)).not.toContain('MARKER')
    expect(dto?.metrics).toEqual([{ valueText: '2x', label: 'Throughput', context: 'Measured in staging' }])
  })

  it('cannot read a draft profile global, including with draft=true', async () => {
    await payload.updateGlobal({
      slug: 'profile',
      data: { displayName: 'Draft Display Name', email: 'draft@example.test' } as never,
      draft: true,
      overrideAccess: true,
    })
    for (const path of ['/api/globals/profile', '/api/globals/profile?draft=true']) {
      const response = await rest('GET', path)
      expect(response.text, path).not.toContain('Draft Display Name')
    }
    expect(await getProfile(PUBLIC_MODE)).toBeNull()
    expect((await getProfile({ draft: true, user: admin.user }))?.displayName).toBe('Draft Display Name')
  })

  it('does not leak draft skills through published projects (TRD §9.7)', async () => {
    const hidden = await payload.create({ collection: 'skills', data: { name: 'HiddenDraftSkill', group: 'ai' } as never, draft: true, overrideAccess: true })
    const visible = await payload.create({
      collection: 'skills',
      data: { name: 'VisibleSkill', group: 'ai', contentReady: true, _status: 'published' } as never,
      overrideAccess: true,
    })
    await publishProject(payload, { slug: 'with-skills', technologies: [hidden.id, visible.id] })

    const dto = await getProject('with-skills', PUBLIC_MODE)
    expect(dto?.technologies).toEqual(['VisibleSkill'])
    for (const depth of [1, 2]) {
      const response = await rest('GET', `/api/projects?where[slug][equals]=with-skills&depth=${depth}`)
      expect(response.text).not.toContain('HiddenDraftSkill')
    }
  })

  it('cannot create content or accounts', async () => {
    const project = await rest('POST', '/api/projects', { body: completeProject({ slug: 'anon-create', _status: 'published' }) })
    expect([401, 403]).toContain(project.status)
    const user = await rest('POST', '/api/users', { body: { email: 'intruder@example.test', password: 'password12345', role: 'admin' } })
    expect([401, 403]).toContain(user.status)
    const register = await rest('POST', '/api/users/first-register', { body: { email: 'late@example.test', password: 'password12345' } })
    expect(register.status).toBeGreaterThanOrEqual(400)
    expect((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs).toBe(1)
  })

  it('answers password reset requests generically', async () => {
    const known = await rest('POST', '/api/users/forgot-password', { body: { email: admin.user.email } })
    const unknown = await rest('POST', '/api/users/forgot-password', { body: { email: 'nobody@example.test' } })
    expect(known.status).toBe(unknown.status)
    expect(known.json).toEqual(unknown.json)
  })

  it('keeps draft rich text out of public DTOs', async () => {
    const project = await publishProject(payload, { slug: 'rich-text-draft', context: richText('Published context.') })
    await payload.update({ collection: 'projects', id: project.id, data: { context: richText('Draft-only context.') }, draft: true, overrideAccess: true })
    expect(JSON.stringify(await getProject('rich-text-draft', PUBLIC_MODE))).not.toContain('Draft-only context.')
  })
})
