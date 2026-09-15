import Link from 'next/link'
import type { ReactNode } from 'react'

import type { ExperienceDTO, MediaDTO, ProfileDTO, ProjectSummaryDTO } from '@/lib/content/types'

import { CopyEmail } from './CopyEmail'
import { ProjectImage } from './ProjectImage'

/** Label column + body column: the recurring "engineering note" motif (DESIGN §1). */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-heading`}>
      <div className="container grid">
        <h2 id={`${id}-heading`} className="section__heading col-label">
          {title}
        </h2>
        <div className="col-body">{children}</div>
      </div>
    </section>
  )
}

export function NoteRow({ label, children, id }: { label: string; children: ReactNode; id: string }) {
  return (
    <section className="note grid" aria-labelledby={id}>
      <h2 id={id} className="note__label col-label">
        {label}
      </h2>
      <div className="col-body">{children}</div>
    </section>
  )
}

export function ProjectList({ items, headingLevel, showcase = false }: { items: ProjectSummaryDTO[]; headingLevel: 2 | 3; showcase?: boolean }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <ul className={showcase ? 'work-list work-list--showcase' : 'work-list'}>
      {items.map((project) => (
        <li key={project.id} className="work-item">
          {project.cover && (
            <figure className="work-item__visual">
              <ProjectImage image={project.cover} title={project.title} href={`/projects/${project.slug}`} caption={project.cover.caption} />
              {project.cover.caption && <figcaption>{project.cover.caption}</figcaption>}
            </figure>
          )}
          <div className="work-item__copy">
          <p className="meta">{[project.categoryLabel, project.organization].filter(Boolean).join(' · ')}</p>
          <Heading className="work-item__title"><Link href={`/projects/${project.slug}`}>{project.title}</Link></Heading>
          <p className="work-item__summary">{project.summary}</p>
          {project.role && <p className="meta">{project.role}</p>}
          <Link href={`/projects/${project.slug}`} className="text-link" aria-label={`Read case study: ${project.title}`}>
            Read case study
          </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Homepage: latest engagement per company with one main contribution. */
export function ExperienceSummary({ experiences }: { experiences: ExperienceDTO[] }) {
  return (
    <ul className="timeline">
      {experiences.map((experience) => {
        const latest = experience.engagements[0]
        if (!latest) return null
        return (
          <li key={experience.id} className="timeline__org">
            <div className="engagement">
              <div className="engagement__head">
                <h3 className="timeline__org-name">{experience.organization}</h3>
                <p className="meta">{latest.period}</p>
              </div>
              <p className="engagement__role">{latest.role}</p>
              {latest.contributions[0] && <p className="work-item__summary">{latest.contributions[0]}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** About page: every engagement, including concurrent periods, without summing durations. */
export function ExperienceTimeline({ experiences }: { experiences: ExperienceDTO[] }) {
  return (
    <ul className="timeline">
      {experiences.map((experience) => (
        <li key={experience.id} className="timeline__org">
          <div>
            <h3 className="timeline__org-name">{experience.organization}</h3>
            <p className="meta">{[experience.location, experience.workModeLabel].filter(Boolean).join(' · ')}</p>
          </div>
          {experience.engagements.map((engagement, index) => (
            <div key={index} className="engagement">
              <div className="engagement__head">
                <p className="engagement__role">
                  {engagement.role}
                  <span className="muted"> · {engagement.employmentTypeLabel}</span>
                </p>
                <p className="meta">{engagement.period}</p>
              </div>
              {engagement.overlapNote && <p className="meta">{engagement.overlapNote}</p>}
              {engagement.summary && <p>{engagement.summary}</p>}
              {engagement.contributions.length > 0 && (
                <ul>
                  {engagement.contributions.map((contribution, i) => (
                    <li key={i}>{contribution}</li>
                  ))}
                </ul>
              )}
              {engagement.technologies.length > 0 && <p className="meta">{engagement.technologies.join(', ')}</p>}
            </div>
          ))}
        </li>
      ))}
    </ul>
  )
}

// Simple Icons paths (CC0). Links without a known icon keep their text label.
const SOCIAL_ICONS: Record<string, string> = {
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
}

export function SocialLinks({ profile }: { profile: ProfileDTO }) {
  if (!profile.socialLinks.length) return null
  return (
    <ul className="inline-list social-links">
      {profile.socialLinks.map((link) => {
        const icon = SOCIAL_ICONS[link.kind]
        return (
          <li key={link.url}>
            {icon ? (
              <a className="icon-link" href={link.url} rel="me noopener noreferrer" aria-label={link.label} title={link.label}>
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                  <path d={icon} fill="currentColor" />
                </svg>
              </a>
            ) : (
              <a className="text-link" href={link.url} rel="me noopener noreferrer">
                {link.label}
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function ResumeLink({ resume }: { resume: MediaDTO | null }) {
  if (!resume) return null
  return (
    <a className="button button--secondary" href={`${resume.url}?download=1`}>
      Download CV
      <span className="button__meta">(PDF{resume.sizeLabel ? `, ${resume.sizeLabel}` : ''})</span>
    </a>
  )
}

export function ContactSection({ profile }: { profile: ProfileDTO }) {
  return (
    <Section id="contact" title="Contact">
      <div className="stack">
        <div className="contact-row">
          <a className="contact-email" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <CopyEmail email={profile.email} />
        </div>
        <SocialLinks profile={profile} />
      </div>
    </Section>
  )
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

export function StatusPage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="container status-page">
      <h1 className="page-title">{title}</h1>
      {children}
    </div>
  )
}
