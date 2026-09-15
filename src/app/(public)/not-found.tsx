import Link from 'next/link'

import { StatusPage } from '@/components/Sections'
import { countProjects } from '@/lib/content/queries'

export default async function NotFound() {
  let hasProjects = false
  try {
    hasProjects = (await countProjects()) > 0
  } catch {
    // A 404 page must still render when the database is unavailable.
  }
  return (
    <StatusPage title="Page not found.">
      <div className="actions">
        <Link className="button button--primary" href="/">
          Home
        </Link>
        {hasProjects && (
          <Link className="button button--secondary" href="/projects">
            Work
          </Link>
        )}
      </div>
    </StatusPage>
  )
}
