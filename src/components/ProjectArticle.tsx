import Link from 'next/link'

import type { ProfileDTO, ProjectDetailDTO, ProjectSummaryDTO } from '@/lib/content/types'
import { richTextHasContent } from '@/lib/validation'

import { RichTextContent } from './RichTextContent'
import { NoteRow } from './Sections'
import { ProjectImage } from './ProjectImage'

type Props = {
  project: ProjectDetailDTO
  next: ProjectSummaryDTO | null
  profile: ProfileDTO | null
}

const NOTES = [
  { key: 'context', label: 'Context' },
  { key: 'contribution', label: 'Contribution' },
  { key: 'decisions', label: 'Decision' },
  { key: 'outcome', label: 'Outcome' },
] as const

export function ProjectArticle({ project, next, profile }: Props) {
  const facts = [
    { term: 'Organization', value: project.organization },
    { term: 'Role', value: project.role },
    { term: 'Period', value: project.period },
    { term: 'Technologies', value: project.technologies.join(', ') || null },
  ].filter((fact): fact is { term: string; value: string } => Boolean(fact.value))

  return (
    <article>
      <header className="container page-header">
        <Link href="/projects" className="back-link">
          Back to work
        </Link>
        <p className="eyebrow">{project.categoryLabel}</p>
        <h1 className="page-title">{project.title}</h1>
        <p className="lead">{project.summary}</p>
        {facts.length > 0 && (
          <dl className="facts">
            {facts.map((fact) => (
              <div key={fact.term}>
                <dt>{fact.term}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {project.cover && (
          <figure className="figure project-cover">
            <ProjectImage image={project.cover} title={project.title} caption={project.cover.caption} />
            {project.cover.caption && <figcaption>{project.cover.caption}</figcaption>}
          </figure>
        )}
      </header>

      <div className="container">
        <div className="notes">
          {NOTES.map(({ key, label }) => {
            const value = project[key]
            const hasMetrics = key === 'outcome' && project.metrics.length > 0
            if (!richTextHasContent(value) && !hasMetrics) return null
            return (
              <NoteRow key={key} id={`note-${key}`} label={label}>
                <RichTextContent value={value} media={project.richTextMedia} />
                {hasMetrics && (
                  <dl className="metrics">
                    {project.metrics.map((metric, index) => (
                      <div key={index}>
                        <dt className="metric__value">{metric.valueText}</dt>
                        <dd>
                          {metric.label}
                          <span className="meta"> · {metric.context}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </NoteRow>
            )
          })}

          {project.gallery.length > 0 && (
            <NoteRow id="note-media" label="Media">
              <div className="gallery">
                {project.gallery.map(({ image, caption }) => (
                  <figure key={image.id} className="figure">
                    <ProjectImage image={image} title={image.alt || project.title} caption={caption || image.caption} />
                    {(caption || image.caption) && <figcaption>{caption || image.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </NoteRow>
          )}

          {project.links.length > 0 && (
            <NoteRow id="note-links" label="Links">
              <ul className="inline-list">
                {project.links.map((link) => (
                  <li key={link.url}>
                    <a className="text-link" href={link.url} rel="noopener noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </NoteRow>
          )}
        </div>

        <nav className="project-footer" aria-label="Project navigation">
          {next ? (
            <Link href={`/projects/${next.slug}`} className="text-link">
              {`Next project: ${next.title}`}
            </Link>
          ) : (
            <span />
          )}
          {profile && (
            <a className="text-link" href={`mailto:${profile.email}`}>
              Email {profile.displayName.split(' ')[0]}
            </a>
          )}
        </nav>
      </div>
    </article>
  )
}
