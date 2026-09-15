import { OG_SIZE, renderOgImage } from '@/components/og'
import { getProfile, getProject } from '@/lib/content/queries'
import { SLUG_PATTERN } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Project title'

export default async function ProjectOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [project, profile] = await Promise.all([SLUG_PATTERN.test(slug) ? getProject(slug) : null, getProfile()])
  return renderOgImage({
    eyebrow: profile?.displayName ?? 'Portfolio',
    title: project?.title ?? 'Case study',
  })
}
