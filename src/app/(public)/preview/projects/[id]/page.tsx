import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectArticle } from '@/components/ProjectArticle'
import { getReadMode } from '@/lib/auth/read-mode'
import { getNextProject, getProfile, getProjectForPreview } from '@/lib/content/queries'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  title: 'Draft preview',
  robots: { index: false, follow: false },
}

/** Same layout as the public case study, for drafts that may not have a slug yet. Admin session required. */
export default async function ProjectPreviewPage({ params }: Props) {
  const { id } = await params
  if (!/^\d{1,12}$/.test(id)) notFound()

  const mode = await getReadMode()
  if (!mode.draft) notFound()

  const project = await getProjectForPreview(Number(id), mode)
  if (!project) notFound()

  const [next, profile] = await Promise.all([getNextProject(project.id, mode), getProfile(mode)])
  return <ProjectArticle project={project} next={next} profile={profile} />
}
