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
