import { OG_SIZE, renderOgImage } from '@/components/og'
import { getProfile } from '@/lib/content/queries'

export const dynamic = 'force-dynamic'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Name and role'

export default async function OpenGraphImage() {
  const profile = await getProfile()
  return renderOgImage({
    eyebrow: profile?.displayName ?? 'Portfolio',
    title: profile?.roleLabel ?? 'Software engineering portfolio',
  })
}
