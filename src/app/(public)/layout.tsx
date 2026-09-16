import type { Metadata } from 'next'
import { Geist, Newsreader } from 'next/font/google'
import type { ReactNode } from 'react'

import '@/styles/globals.css'

import { PreviewBanner, SiteFooter, SiteHeader } from '@/components/SiteChrome'
import { FlowBackground } from '@/components/FlowBackground'
import { THEME_INIT_SCRIPT } from '@/components/theme'
import { getReadMode } from '@/lib/auth/read-mode'
import { countProjects, getProfile, getSettings } from '@/lib/content/queries'
import { absoluteURL, getServerURL } from '@/lib/env'

const sans = Geist({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-sans', display: 'swap' })
const serif = Newsreader({ subsets: ['latin'], weight: ['400'], variable: '--font-serif', display: 'swap' })

// Rendered per request without a shared content cache (TRD §5 baseline).
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const mode = await getReadMode()
  const [settings, profile] = await Promise.all([getSettings(mode), getProfile(mode)])
  const siteName = settings?.siteName ?? profile?.displayName ?? 'Portfolio'
  const description = settings?.defaultSeoDescription || profile?.heroIntro || undefined
  return {
    metadataBase: new URL(getServerURL()),
    title: { default: settings?.defaultSeoTitle ?? siteName, template: `%s · ${siteName}` },
    description,
    icons: {
      icon: [
        // SVG first: it recolours itself for dark mode via an internal prefers-color-scheme query,
        // which is the only widely supported way to get a dark-mode favicon.
        { url: '/brand/vincent-siauw-logo.svg', type: 'image/svg+xml', sizes: 'any' },
        // PNG fallbacks for browsers without SVG favicon support; the media hints help where honoured.
        { url: '/brand/vincent-siauw-logo-white-32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: dark)' },
        { url: '/brand/vincent-siauw-logo-white-192.png', sizes: '192x192', type: 'image/png', media: '(prefers-color-scheme: dark)' },
        { url: '/brand/vincent-siauw-logo-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/brand/vincent-siauw-logo-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [{ url: '/brand/vincent-siauw-logo-180.png', sizes: '180x180', type: 'image/png' }],
    },
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName,
      ...(settings?.socialImage ? { images: [{ url: absoluteURL(settings.socialImage.url), alt: settings.socialImage.alt }] } : {}),
    },
    robots: mode.draft ? { index: false, follow: false } : undefined,
  }
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const mode = await getReadMode()
  const [profile, settings, projectCount] = await Promise.all([getProfile(mode), getSettings(mode), countProjects(mode)])
  const name = profile?.displayName ?? settings?.siteName ?? 'Portfolio'

  return (
    <html lang="en" data-theme="light" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {mode.draft && <PreviewBanner />}
        <SiteHeader name={name} showWork={projectCount > 0} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter name={name} location={profile?.location ?? null} footerText={settings?.footerText ?? null} />
        <FlowBackground />
      </body>
    </html>
  )
}
