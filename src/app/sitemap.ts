import type { MetadataRoute } from 'next'

import { getProfile, getSitemapProjects } from '@/lib/content/queries'
import { absoluteURL } from '@/lib/env'

export const dynamic = 'force-dynamic'

/** Published public URLs only. Admin, preview, API, and media routes are never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profile, projects] = await Promise.all([getProfile(), getSitemapProjects()])
  if (!profile) return []
  return [
    { url: absoluteURL('/') },
    { url: absoluteURL('/about') },
    ...(projects.length ? [{ url: absoluteURL('/projects') }] : []),
    ...projects.map((project) => ({ url: absoluteURL(`/projects/${project.slug}`), lastModified: project.updatedAt })),
  ]
}
