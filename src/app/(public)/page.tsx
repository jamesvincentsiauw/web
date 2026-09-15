import Link from 'next/link'

import { ContactSection, ExperienceSummary, JsonLd, ProjectList, ResumeLink, Section, SocialLinks, StatusPage } from '@/components/Sections'
import { getReadMode } from '@/lib/auth/read-mode'
import { getExperiences, getHomeProjects, getProfile } from '@/lib/content/queries'
import { getServerURL } from '@/lib/env'

export default async function HomePage() {
  const mode = await getReadMode()
  const [profile, work, experiences] = await Promise.all([getProfile(mode), getHomeProjects(mode), getExperiences(mode)])

  if (!profile) {
    return (
      <StatusPage title="This site is being prepared.">
        <p className="lead">Please check back soon.</p>
      </StatusPage>
    )
  }

  const hasWork = work.items.length > 0
  const primaryAction = hasWork
    ? { href: '/#work', label: 'View selected work' }
    : experiences.length > 0
      ? { href: '/#experience', label: 'View experience' }
      : null

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.displayName,
          jobTitle: profile.roleLabel,
          email: `mailto:${profile.email}`,
          url: getServerURL(),
          ...(profile.location ? { homeLocation: { '@type': 'Place', name: profile.location } } : {}),
          ...(profile.socialLinks.length ? { sameAs: profile.socialLinks.map((link) => link.url) } : {}),
        }}
      />

      <section className="container hero" aria-labelledby="hero-heading">
        <p className="eyebrow">{profile.roleLabel}</p>
        <h1 id="hero-heading" className="hero__heading">
          {profile.heroHeading}
        </h1>
        <div className="hero__detail">
          <div>
            <p className="lead">{profile.heroIntro}</p>
            <div className="actions">
              {primaryAction && (
                <a className="button button--primary" href={primaryAction.href}>
                  {primaryAction.label}
                </a>
              )}
              <ResumeLink resume={profile.resume} />
            </div>
          </div>
          <div className="hero__aside">
            {profile.location && <p className="meta">{profile.location}</p>}
            <SocialLinks profile={profile} />
          </div>
        </div>
      </section>

      {hasWork && (
        <section id="work" className="section selected-work container" aria-labelledby="work-heading">
          <div className="selected-work__heading">
            <h2 id="work-heading" className="section__heading">Selected work</h2>
              <Link href="/projects" className="text-link">
                All projects
              </Link>
          </div>
          <ProjectList items={work.items} headingLevel={3} showcase />
        </section>
      )}

      {experiences.length > 0 && (
        <Section id="experience" title="Experience">
          <ExperienceSummary experiences={experiences} />
        </Section>
      )}

      {profile.shortBio && (
        <Section id="about" title="About">
          <div className="prose">
            <p>{profile.shortBio}</p>
            <p>
              <Link href="/about" className="text-link">
                More about my experience
              </Link>
            </p>
          </div>
        </Section>
      )}

      <ContactSection profile={profile} />
    </>
  )
}
