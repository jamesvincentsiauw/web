import type { Metadata } from 'next'

import { RichTextContent } from '@/components/RichTextContent'
import { ContactSection, ExperienceTimeline, ResumeLink, Section, StatusPage } from '@/components/Sections'
import { getReadMode } from '@/lib/auth/read-mode'
import { getEducation, getExperiences, getProfile, getSkillGroups } from '@/lib/content/queries'

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile(await getReadMode())
  return {
    title: 'About',
    description: profile?.shortBio ?? profile?.heroIntro ?? undefined,
    alternates: { canonical: '/about' },
  }
}

export default async function AboutPage() {
  const mode = await getReadMode()
  const [profile, experiences, skillGroups, education] = await Promise.all([
    getProfile(mode),
    getExperiences(mode),
    getSkillGroups(mode),
    getEducation(mode),
  ])

  if (!profile) {
    return (
      <StatusPage title="This page is being prepared.">
        <p className="lead">Please check back soon.</p>
      </StatusPage>
    )
  }

  const hasBio = Boolean(profile.fullBio) || Boolean(profile.shortBio)
  const hasPersonalDetails = profile.spokenLanguages.length > 0 || profile.relocationText || profile.availabilityText

  return (
    <>
      <header className="container page-header">
        <p className="eyebrow">{[profile.displayName, profile.location].filter(Boolean).join(' · ')}</p>
        <h1 className="page-title">About</h1>
        {hasBio && (
          <div className="lead prose">
            {profile.fullBio ? <RichTextContent value={profile.fullBio} media={profile.fullBioMedia} className="stack" /> : <p>{profile.shortBio}</p>}
          </div>
        )}
        {profile.resume && (
          <div className="actions" style={{ marginTop: 28 }}>
            <ResumeLink resume={profile.resume} />
          </div>
        )}
      </header>

      {experiences.length > 0 && (
        <Section id="experience" title="Experience">
          <ExperienceTimeline experiences={experiences} />
        </Section>
      )}

      {skillGroups.length > 0 && (
        <Section id="skills" title="Skills">
          <div className="skill-groups">
            {skillGroups.map((group) => (
              <div key={group.group} className="skill-group">
                <h3>{group.label}</h3>
                <p>{group.skills.join(', ')}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {education.length > 0 && (
        <Section id="education" title="Education">
          <ul className="timeline">
            {education.map((item) => (
              <li key={item.id} className="timeline__org">
                <div className="engagement">
                  <div className="engagement__head">
                    <h3 className="timeline__org-name">{item.institution}</h3>
                    <p className="meta">{item.years}</p>
                  </div>
                  <p className="engagement__role">
                    {item.qualification} in {item.field}
                  </p>
                  {item.gpa && <p className="meta">{`GPA ${item.gpa}`}</p>}
                  {item.thesisTitle && <p>{`Thesis: ${item.thesisTitle}`}</p>}
                  {item.notes && <p>{item.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {hasPersonalDetails && (
        <Section id="languages" title="Languages & location">
          <div className="stack">
            {profile.spokenLanguages.length > 0 && (
              <p>{profile.spokenLanguages.map((language) => `${language.name} (${language.proficiency})`).join(', ')}</p>
            )}
            {profile.relocationText && <p>{profile.relocationText}</p>}
            {profile.availabilityText && <p>{profile.availabilityText}</p>}
          </div>
        </Section>
      )}

      <ContactSection profile={profile} />
    </>
  )
}
