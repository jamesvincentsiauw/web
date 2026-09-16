import Link from 'next/link'
import Image from 'next/image'

import { NavLink } from './NavLink'
import { ThemeSelect } from './ThemeSelect'

const mobileItems = [
  { label: 'Home', href: '/', path: 'M3 10 12 3l9 7v10H3z M9 20v-7h6v7' },
  { label: 'Work', href: '/projects', path: 'M3 7h18v14H3z M8 7V3h8v4 M3 12h18 M10 12v3h4v-3' },
  { label: 'About', href: '/about', path: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2' },
  { label: 'Contact', href: '/#contact', path: 'M3 5h18v14H3z M3 6l9 7 9-7' },
]

export function SiteHeader({ name, showWork }: { name: string; showWork: boolean }) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink href="/" className="wordmark" activePrefix="/" exact>
          {/* Both marks ship; CSS shows one per theme so the swap happens before paint, without hydration flicker. */}
          <Image className="logo-mark logo-mark--light" src="/brand/vincent-siauw-logo-192.png" alt="" width={36} height={36} priority />
          <Image className="logo-mark logo-mark--dark" src="/brand/vincent-siauw-logo-white-192.png" alt="" width={36} height={36} priority />
          {name}
        </NavLink>
        <nav className="site-nav" aria-label="Primary">
          <ul>
            {showWork && (
              <li>
                <NavLink href="/projects" className="nav-link" activePrefix="/projects">
                  Work
                </NavLink>
              </li>
            )}
            <li>
              <NavLink href="/about" className="nav-link" activePrefix="/about">
                About
              </NavLink>
            </li>
            <li>
              <NavLink href="/#contact" className="nav-link">
                Contact
              </NavLink>
            </li>
          </ul>
        </nav>
        <ThemeSelect />
      </div>
      <nav className="mobile-dock" aria-label="Mobile navigation">
        <ul>
          {mobileItems.filter(item => showWork || item.label !== 'Work').map(item => (
            <li key={item.label}>
              <NavLink href={item.href} className="mobile-dock__link" activePrefix={item.label === 'Contact' ? undefined : item.href} exact={item.label === 'Home'}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={item.path} /></svg>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export function SiteFooter({ name, location, footerText }: { name: string; location: string | null; footerText: string | null }) {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner meta">
        <p>{[name, location].filter(Boolean).join(' · ')}</p>
        {footerText && <p>{footerText}</p>}
      </div>
    </footer>
  )
}

export function PreviewBanner() {
  return (
    <div className="preview-banner" role="region" aria-label="Draft preview">
      <div className="container preview-banner__inner">
        <p>
          <strong>Draft preview.</strong> Visible only to signed-in admins.
        </p>
        <Link href="/api/preview/exit" prefetch={false}>
          Exit preview
        </Link>
      </div>
    </div>
  )
}
