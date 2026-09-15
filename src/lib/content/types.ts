import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import type { User } from '../../payload-types'

/** Who is reading. Public requests never carry a user and never read drafts. */
export type ReadMode = { draft: boolean; user: User | null }

export const PUBLIC_MODE: ReadMode = Object.freeze({ draft: false, user: null })

export type RichTextValue = SerializedEditorState

export type MediaDTO = {
  id: number
  url: string
  alt: string
  caption: string | null
  width: number | null
  height: number | null
  mimeType: string
  sizeLabel: string | null
}

export type MediaMap = Record<number, MediaDTO>

export type LinkDTO = { kind: string; label: string; url: string }

export type ProfileDTO = {
  displayName: string
  roleLabel: string
  heroHeading: string
  heroIntro: string
  location: string | null
  shortBio: string | null
  fullBio: RichTextValue | null
  fullBioMedia: MediaMap
  email: string
  socialLinks: LinkDTO[]
  resume: MediaDTO | null
  availabilityText: string | null
  relocationText: string | null
  spokenLanguages: Array<{ name: string; proficiency: string }>
}

export type SettingsDTO = {
  siteName: string
  defaultSeoTitle: string
  defaultSeoDescription: string
  socialImage: MediaDTO | null
  footerText: string | null
}

export type ProjectSummaryDTO = {
  id: number
  slug: string
  title: string
  summary: string
  categoryLabel: string
  organization: string | null
  cover?: MediaDTO | null
  role?: string
}

export type ProjectDetailDTO = ProjectSummaryDTO & {
  role: string
  period: string | null
  technologies: string[]
  context: RichTextValue | null
  contribution: RichTextValue | null
  decisions: RichTextValue | null
  outcome: RichTextValue | null
  metrics: Array<{ valueText: string; label: string; context: string }>
  cover: MediaDTO | null
  gallery: Array<{ image: MediaDTO; caption: string | null }>
  links: LinkDTO[]
  seo: { title: string; description: string; image: MediaDTO | null }
  richTextMedia: MediaMap
  updatedAt: string
}

export type EngagementDTO = {
  role: string
  employmentTypeLabel: string
  period: string
  isCurrent: boolean
  summary: string | null
  contributions: string[]
  technologies: string[]
  overlapNote: string | null
}

export type ExperienceDTO = {
  id: number
  organization: string
  location: string | null
  workModeLabel: string | null
  engagements: EngagementDTO[]
}

export type SkillGroupDTO = { group: string; label: string; skills: string[] }

export type EducationDTO = {
  id: number
  institution: string
  qualification: string
  field: string
  years: string
  gpa: string | null
  thesisTitle: string | null
  notes: string | null
}

export type Paginated<T> = { items: T[]; page: number; totalPages: number; totalDocs: number }
