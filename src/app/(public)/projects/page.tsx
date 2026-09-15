import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProjectList } from '@/components/Sections'
import { getReadMode } from '@/lib/auth/read-mode'
import { listProjects } from '@/lib/content/queries'
import { parseProjectPage as parsePage, projectPageRange } from '@/lib/pagination'

type Props = { searchParams: Promise<{ page?: string | string[] }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parsePage((await searchParams).page)
  return {
    title: 'Work',
    description: 'Case studies described by context, contribution, decisions, and outcome.',
    alternates: { canonical: page && page > 1 ? `/projects?page=${page}` : '/projects' },
  }
}

export default async function ProjectsPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).page)
  if (page === null) notFound()

  const mode = await getReadMode()
  const result = await listProjects({ page }, mode)
  const range = projectPageRange(page, result.totalDocs)
  if ((result.totalDocs === 0 && page !== 1) || (result.totalDocs > 0 && page > result.totalPages)) notFound()

  return (
    <>
      <header className="container page-header">
        <h1 className="page-title">Work</h1>
        <p className="lead">Case studies described by context, my contribution, the decisions made, and the outcome.</p>
      </header>

      <div className="container section" id="project-results" tabIndex={-1}>
        {result.items.length === 0 ? (
          <p className="lead">
            Case studies will be added here. You can read my <Link href="/about">experience</Link> in the meantime.
          </p>
        ) : (
          <>
            <p className="meta results-summary">Showing {range.first}–{range.last} of {result.totalDocs} projects</p>
            <ProjectList items={result.items} headingLevel={2} />
            {result.totalPages > 1 && (
              <nav className="pagination" aria-label="Pagination">
                {page > 1 ? (
                  <a className="text-link" href={`${page === 2 ? '/projects' : `/projects?page=${page - 1}`}#project-results`} rel="prev">
                    Previous
                  </a>
                ) : (
                  <span />
                )}
                <p className="meta">
                  Page {page} of {result.totalPages}
                </p>
                {page < result.totalPages ? (
                  <a className="text-link" href={`/projects?page=${page + 1}#project-results`} rel="next">
                    Next
                  </a>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  )
}
