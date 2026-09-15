/**
 * Copies editorial content between environments without media files.
 *
 *   pnpm sync-content export <file.json>   # read from the DATABASE_URL in the current env
 *   pnpm sync-content import <file.json>   # REPLACE editorial content in the target DATABASE_URL
 *
 * Copied: profile, site settings, projects, experiences, skills, education (with draft/published
 * status). Not copied: users, media, redirects. Every media reference (covers, gallery, SEO/social
 * images, CV, rich-text images) is removed, because the files themselves are not transferred.
 */
import 'dotenv/config'

import { readFileSync, writeFileSync } from 'fs'
import { getPayload, type Payload } from 'payload'

import config from '../src/payload.config'

type Doc = Record<string, unknown> & { id?: number; _status?: 'draft' | 'published' | null }
type Bundle = {
  exportedAt: string
  skills: Doc[]
  experiences: Doc[]
  education: Doc[]
  projects: Doc[]
  profile: Doc
  siteSettings: Doc
}

const [mode, file] = process.argv.slice(2)
if (!['export', 'import'].includes(mode ?? '') || !file) {
  console.error('Usage: pnpm sync-content <export|import> <file.json>')
  process.exit(1)
}

const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'mediaRefs', 'globalType'])

/** Removes system fields and array row ids so the target generates its own. */
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      if (SYSTEM_FIELDS.has(key)) continue
      out[key] = clean(child)
    }
    return out
  }
  return value
}

/** Drops Lexical upload nodes (images) from rich text. */
function stripRichTextUploads(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((node) => !(node && typeof node === 'object' && (node as Doc).type === 'upload')).map(stripRichTextUploads)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, stripRichTextUploads(child)]))
  }
  return value
}

function withoutMedia(collection: string, doc: Doc): Doc {
  const copy = stripRichTextUploads(doc) as Doc
  if (collection === 'projects') {
    copy.cover = null
    copy.gallery = []
    copy.seo = { ...((copy.seo as Doc) ?? {}), image: null }
  }
  if (collection === 'profile') copy.resume = null
  if (collection === 'site-settings') copy.socialImage = null
  return copy
}

async function exportContent(payload: Payload) {
  const read = async (collection: 'skills' | 'experiences' | 'education' | 'projects') => {
    const result = await payload.find({ collection, depth: 0, pagination: false, sort: 'id', overrideAccess: true })
    return result.docs.map((doc) => ({ sourceId: doc.id, ...(clean(withoutMedia(collection, doc as unknown as Doc)) as Doc) }))
  }
  const bundle: Bundle = {
    exportedAt: new Date().toISOString(),
    skills: await read('skills'),
    experiences: await read('experiences'),
    education: await read('education'),
    projects: await read('projects'),
    profile: clean(withoutMedia('profile', (await payload.findGlobal({ slug: 'profile', depth: 0, overrideAccess: true })) as unknown as Doc)) as Doc,
    siteSettings: clean(withoutMedia('site-settings', (await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })) as unknown as Doc)) as Doc,
  }
  writeFileSync(file, JSON.stringify(bundle, null, 2))
  const summary = (docs: Doc[]) => `${docs.length} (${docs.filter((d) => d._status === 'published').length} published)`
  console.log(
    `Exported to ${file}: skills ${summary(bundle.skills)}, experiences ${summary(bundle.experiences)}, education ${summary(bundle.education)}, projects ${summary(bundle.projects)}, profile ${bundle.profile._status}, site settings ${bundle.siteSettings._status}.`,
  )
}

async function importContent(payload: Payload) {
  const bundle = JSON.parse(readFileSync(file, 'utf8')) as Bundle

  // Replace editorial content. Users are untouched; project deletes also remove their redirects.
  for (const collection of ['projects', 'experiences', 'education', 'skills'] as const) {
    const { docs } = await payload.find({ collection, depth: 0, pagination: false, overrideAccess: true })
    for (const doc of docs) await payload.delete({ collection, id: doc.id, overrideAccess: true })
  }
  await payload.delete({ collection: 'redirects', where: { id: { exists: true } }, overrideAccess: true })

  const idMap = { skills: new Map<number, number>(), experiences: new Map<number, number>() }
  const remap = (map: Map<number, number>, value: unknown) => (typeof value === 'number' ? (map.get(value) ?? null) : null)

  const create = async (collection: 'skills' | 'experiences' | 'education' | 'projects', source: Doc) => {
    const { sourceId, ...data } = source as Doc & { sourceId: number }
    const isPublished = data._status === 'published'
    const created = await payload.create({ collection, data: data as never, draft: !isPublished, overrideAccess: true })
    return { sourceId, id: created.id }
  }

  for (const skill of bundle.skills) {
    const { sourceId, id } = await create('skills', skill)
    idMap.skills.set(sourceId, id)
  }
  for (const experience of bundle.experiences) {
    const engagements = ((experience.engagements as Doc[]) ?? []).map((engagement) => ({
      ...engagement,
      technologies: ((engagement.technologies as unknown[]) ?? []).map((t) => remap(idMap.skills, t)).filter((t) => t !== null),
    }))
    const { sourceId, id } = await create('experiences', { ...experience, engagements })
    idMap.experiences.set(sourceId, id)
  }
  for (const item of bundle.education) await create('education', item)
  // Published projects first so featured/slug guards see a consistent state.
  const projects = [...bundle.projects].sort((a, b) => Number(b._status === 'published') - Number(a._status === 'published'))
  for (const project of projects) {
    await create('projects', {
      ...project,
      experience: remap(idMap.experiences, project.experience),
      technologies: ((project.technologies as unknown[]) ?? []).map((t) => remap(idMap.skills, t)).filter((t) => t !== null),
    })
  }

  for (const [slug, data] of [
    ['profile', bundle.profile],
    ['site-settings', bundle.siteSettings],
  ] as const) {
    await payload.updateGlobal({ slug, data: data as never, draft: data._status !== 'published', overrideAccess: true })
  }

  const count = async (collection: 'skills' | 'experiences' | 'education' | 'projects') => {
    const all = await payload.count({ collection, overrideAccess: true })
    const published = await payload.count({ collection, where: { _status: { equals: 'published' } }, overrideAccess: true })
    return `${all.totalDocs} (${published.totalDocs} published)`
  }
  console.log(
    `Imported from ${file}: skills ${await count('skills')}, experiences ${await count('experiences')}, education ${await count('education')}, projects ${await count('projects')}.`,
  )
}

const payload = await getPayload({ config })
if (mode === 'export') await exportContent(payload)
else await importContent(payload)
process.exit(0)
