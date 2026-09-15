import type { Media } from '../../payload-types'
import { getPayloadClient } from '../payload'
import { relationId } from '../validation'

type WithRefs = { _status?: string | null; mediaRefs?: unknown[] | null } | null | undefined

const referencesMedia = (doc: WithRefs, id: number) =>
  doc?._status === 'published' && (doc.mediaRefs ?? []).some((ref) => relationId(ref) === id)

/**
 * A file is public only when it is marked public, confirmed ready, and referenced by at least one
 * *published* snapshot (TRD §5). Main-table rows hold the published snapshot, so drafts that merely
 * reference the file do not count.
 */
export async function findPubliclyAvailableMedia(id: number): Promise<Media | null> {
  const payload = await getPayloadClient()
  const media = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true, disableErrors: true })
  if (!media || media.visibility !== 'public' || media.contentReady !== true) return null

  const [projects, profile, settings] = await Promise.all([
    payload.count({
      collection: 'projects',
      where: { and: [{ _status: { equals: 'published' } }, { mediaRefs: { in: [id] } }] },
      overrideAccess: true,
    }),
    payload.findGlobal({ slug: 'profile', depth: 0, overrideAccess: true }),
    payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }),
  ])

  if (projects.totalDocs > 0 || referencesMedia(profile, id) || referencesMedia(settings, id)) return media
  return null
}
