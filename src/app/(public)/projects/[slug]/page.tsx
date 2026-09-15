import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { ProjectArticle } from '@/components/ProjectArticle'
import { JsonLd } from '@/components/Sections'
import { getReadMode } from '@/lib/auth/read-mode'
import { getNextProject, getProfile, getProject, getProjectRedirect } from '@/lib/content/queries'
import { absoluteURL } from '@/lib/env'
import { SLUG_PATTERN } from '@/lib/validation'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!SLUG_PATTERN.test(slug)) return {}
  const project = await getProject(slug, await getReadMode())
  if (!project) return { title: 'Page not found' }
  return {
    title: project.seo.title,
    description: project.seo.description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: 'article',
      title: project.seo.title,
      description: project.seo.description,
      ...(project.seo.image ? { images: [{ url: absoluteURL(project.seo.image.url), alt: project.seo.image.alt }] } : {}),
    },
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  if (!SLUG_PATTERN.test(slug)) notFound()

  const mode = await getReadMode()
  const project = await getProject(slug, mode)
  if (!project) {
    const target = await getProjectRedirect(slug)
    if (target) permanentRedirect(target)
    notFound()
  }

  const [next, profile] = await Promise.all([getNextProject(project.id, mode), getProfile(mode)])

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          abstract: project.summary,
          url: absoluteURL(`/projects/${project.slug}`),
          dateModified: project.updatedAt,
          ...(profile ? { author: { '@type': 'Person', name: profile.displayName } } : {}),
        }}
      />
      <ProjectArticle project={project} next={next} profile={profile} />
    </>
  )
}
