'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

type Props = {
  href: string
  className?: string
  children: ReactNode
  /** Path prefix that marks this link as the current page. Anchors (/#contact) never do. */
  activePrefix?: string
  exact?: boolean
}

export function NavLink({ href, className, children, activePrefix, exact = false }: Props) {
  const pathname = usePathname()
  const isActive = activePrefix !== undefined && (exact ? pathname === activePrefix : pathname === activePrefix || pathname.startsWith(`${activePrefix}/`))
  return (
    <Link href={href} className={className} aria-current={isActive ? 'page' : undefined}>
      {children}
    </Link>
  )
}
