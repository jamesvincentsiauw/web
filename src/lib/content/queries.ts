import type { Payload, Where } from 'payload'

import { projectPath } from '../../collections/Projects'
import { SKILL_GROUPS } from '../../collections/Skills'
import type { Education, Experience, Media, Profile, Project, SiteSetting, Skill } from '../../payload-types'
import { getPayloadClient } from '../payload'
import { collectRichTextUploadIds, formatFileSize, formatMonth, isHttpUrl, relationId, uniqueIds } from '../validation'
import type {
  EducationDTO,
  ExperienceDTO,
  LinkDTO,
  MediaDTO,
  MediaMap,
  Paginated,
  ProfileDTO,
  ProjectDetailDTO,
  ProjectSummaryDTO,
  ReadMode,
  RichTextValue,
  SettingsDTO,
  SkillGroupDTO,
} from './types'
import { PUBLIC_MODE } from './types'

import { PROJECT_PAGE_SIZE } from '../pagination'
export const PROJECTS_PER_PAGE = PROJECT_PAGE_SIZE
const PROJECT_SORT = ['sortOrder', 'id']

const CATEGORY_LABELS: Record<Project['category'], string> = {
  'ai-workflows': 'AI workflows',
  'data-infrastructure': 'Data infrastructure',
  'product-engineering': 'Product engineering',
  research: 'Research',
}

const EMPLOYMENT_LABELS: Record<Experience['engagements'][number]['employmentType'], string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  freelance: 'Freelance',
  internship: 'Internship',
}

const WORK_MODE_LABELS: Record<NonNullable<Experience['workMode']>, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}

/**
 * Reader arguments. overrideAccess is always false so collection/field access rules decide what
 * is visible; depth 0 so relations are resolved explicitly below and drafts cannot leak through
 * automatic population.
 */
function readArgs(mode: ReadMode) {
  return {
    draft: mode.draft,
    overrideAccess: false,
    user: mode.user ?? undefined,
    depth: 0,
  } as const
}

function isPublishedOrPreview(doc: { _status?: string | null } | null | undefined, mode: ReadMode) {
  return Boolean(doc && (mode.draft || doc._status === 'published'))
}

const text = (value: string | null | undefined) => (typeof value === 'string' && value.trim() ? value.trim() : null)

function toMediaDTO(doc: Media): MediaDTO {
  return {
    id: doc.id,
    url: `/media/${doc.id}`,
    alt: doc.decorative ? '' : (doc.alt ?? ''),
    caption: text(doc.caption),
    width: doc.width ?? null,
    height: doc.height ?? null,
    mimeType: doc.mimeType ?? 'application/octet-stream',
    sizeLabel: formatFileSize(doc.filesize),
  }
}

/**
 * Media referenced by content the reader is allowed to see. Public readers only get files marked
 * public and ready; the IDs come from published documents, which satisfies the reference rule.
 */
async function resolveMedia(payload: Payload, ids: Array<number | null>, mode: ReadMode): Promise<MediaMap> {
  const unique = uniqueIds(ids)
  if (!unique.length) return {}
  const where: Where = mode.user
    ? { id: { in: unique } }
    : { and: [{ id: { in: unique } }, { visibility: { equals: 'public' } }, { contentReady: { equals: true } }] }
  const result = await payload.find({ collection: 'media', where, depth: 0, pagination: false, overrideAccess: true })
  return Object.fromEntries(result.docs.map((doc) => [doc.id, toMediaDTO(doc)]))
}

async function resolveSkills(payload: Payload, ids: Array<number | null>, mode: ReadMode): Promise<Map<number, Skill>> {
  const unique = uniqueIds(ids)
  if (!unique.length) return new Map()
  const result = await payload.find({
    collection: 'skills',
    ...readArgs(mode),
    where: { id: { in: unique } },
    pagination: false,
  })
  return new Map(result.docs.filter((doc) => isPublishedOrPreview(doc, mode)).map((doc) => [doc.id, doc]))
}

function skillNames(values: Array<number | Skill> | null | undefined, skills: Map<number, Skill>): string[] {
  return (values ?? []).map((value) => skills.get(relationId(value) ?? -1)?.name).filter((name): name is string => Boolean(name))
}

function safeLinks(links: Array<{ kind: string; label: string; url: string }> | null | undefined): LinkDTO[] {
  return (links ?? [])
    .filter((link) => isHttpUrl(link.url) && text(link.label))
    .map((link) => ({ kind: link.kind, label: link.label.trim(), url: link.url }))
}

function richText(value: unknown): RichTextValue | null {
  return value && typeof value === 'object' && 'root' in value ? (value as RichTextValue) : null
}

export function formatPeriod(start?: string | null, end?: string | null, isCurrent = false): string | null {
  const from = formatMonth(start)
  const to = isCurrent ? 'Present' : formatMonth(end)
  if (from && to) return `${from} – ${to}`
  return from ?? to
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

export async function getProfile(mode: ReadMode = PUBLIC_MODE): Promise<ProfileDTO | null> {
  const payload = await getPayloadClient()
  const doc = (await payload.findGlobal({ slug: 'profile', ...readArgs(mode) })) as Partial<Profile>
  if (!isPublishedOrPreview(doc, mode) || !text(doc.displayName) || !text(doc.email)) return null

  const media = await resolveMedia(payload, [relationId(doc.resume), ...collectRichTextUploadIds(doc.fullBio)], mode)
  const resumeId = relationId(doc.resume)
  const resume = resumeId !== null ? media[resumeId] : undefined

  return {
    displayName: doc.displayName!.trim(),
    roleLabel: text(doc.roleLabel) ?? '',
    heroHeading: text(doc.heroHeading) ?? '',
    heroIntro: text(doc.heroIntro) ?? '',
    location: text(doc.location),
    shortBio: text(doc.shortBio),
    fullBio: richText(doc.fullBio),
    fullBioMedia: media,
    email: doc.email!.trim(),
    socialLinks: safeLinks(doc.socialLinks),
    resume: resume?.mimeType === 'application/pdf' ? resume : null,
    availabilityText: text(doc.availabilityText),
    relocationText: text(doc.relocationText),
    spokenLanguages: (doc.spokenLanguages ?? []).map(({ name, proficiency }) => ({ name, proficiency })),
  }
}

export async function getSettings(mode: ReadMode = PUBLIC_MODE): Promise<SettingsDTO | null> {
  const payload = await getPayloadClient()
  const doc = (await payload.findGlobal({ slug: 'site-settings', ...readArgs(mode) })) as Partial<SiteSetting>
  if (!isPublishedOrPreview(doc, mode) || !text(doc.siteName)) return null
  const imageId = relationId(doc.socialImage)
  const media = await resolveMedia(payload, [imageId], mode)
  return {
    siteName: doc.siteName!.trim(),
    defaultSeoTitle: text(doc.defaultSeoTitle) ?? doc.siteName!.trim(),
    defaultSeoDescription: text(doc.defaultSeoDescription) ?? '',
    socialImage: imageId !== null ? (media[imageId] ?? null) : null,
    footerText: text(doc.footerText),
  }
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

function toProjectSummary(doc: Project): ProjectSummaryDTO {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    categoryLabel: CATEGORY_LABELS[doc.category] ?? '',
    organization: text(doc.organization),
  }
}

export async function listProjects(
  { page = 1, featuredOnly = false }: { page?: number; featuredOnly?: boolean },
  mode: ReadMode = PUBLIC_MODE,
): Promise<Paginated<ProjectSummaryDTO>> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    ...readArgs(mode),
    where: featuredOnly ? { featured: { equals: true } } : undefined,
    sort: PROJECT_SORT,
    page,
    limit: PROJECTS_PER_PAGE,
  })
  const visible = result.docs.filter((doc) => isPublishedOrPreview(doc, mode) && doc.slug)
  const media = await resolveMedia(payload, visible.map((doc) => relationId(doc.cover)), mode)
  return {
    items: visible.map((doc) => ({
      ...toProjectSummary(doc),
      role: doc.role,
      cover: media[relationId(doc.cover) ?? -1]?.mimeType.startsWith('image/') ? media[relationId(doc.cover)!] : null,
    })),
    page: result.page ?? page,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
  }
}

/** Up to three featured projects; falls back to the first three published when none are featured. */
export async function getHomeProjects(mode: ReadMode = PUBLIC_MODE): Promise<{ items: ProjectSummaryDTO[]; total: number }> {
  const [featured, all] = await Promise.all([listProjects({ featuredOnly: true }, mode), listProjects({}, mode)])
  const items = (featured.items.length ? featured.items : all.items).slice(0, 3)
  return { items, total: all.totalDocs }
}

export async function countProjects(mode: ReadMode = PUBLIC_MODE): Promise<number> {
  const payload = await getPayloadClient()
  const result = await payload.count({ collection: 'projects', overrideAccess: false, user: mode.user ?? undefined })
  return result.totalDocs
}

async function toProjectDetail(payload: Payload, doc: Project, mode: ReadMode): Promise<ProjectDetailDTO> {
  const richTextFields = [doc.context, doc.contribution, doc.decisions, doc.outcome]
  const [skills, media] = await Promise.all([
    resolveSkills(payload, (doc.technologies ?? []).map(relationId), mode),
    resolveMedia(
      payload,
      [
        relationId(doc.cover),
        relationId(doc.seo?.image),
        ...(doc.gallery ?? []).map((item) => relationId(item.image)),
        ...richTextFields.flatMap(collectRichTextUploadIds),
      ],
      mode,
    ),
  ])
  const pick = (value: unknown) => {
    const id = relationId(value)
    return id !== null ? (media[id] ?? null) : null
  }
  const cover = pick(doc.cover)

  return {
    ...toProjectSummary(doc),
    role: doc.role,
    period: formatPeriod(doc.startMonth, doc.endMonth),
    technologies: skillNames(doc.technologies, skills),
    context: richText(doc.context),
    contribution: richText(doc.contribution),
    decisions: richText(doc.decisions),
    outcome: richText(doc.outcome),
    metrics: (doc.metrics ?? []).map(({ valueText, label, context }) => ({ valueText, label, context })),
    cover: cover?.mimeType.startsWith('image/') ? cover : null,
    gallery: (doc.gallery ?? []).flatMap((item) => {
      const image = pick(item.image)
      return image?.mimeType.startsWith('image/') ? [{ image, caption: text(item.caption) }] : []
    }),
    links: safeLinks(doc.links),
    seo: {
      title: text(doc.seo?.title) ?? doc.title,
      description: text(doc.seo?.description) ?? doc.summary,
      image: pick(doc.seo?.image),
    },
    richTextMedia: media,
    updatedAt: doc.updatedAt,
  }
}

/** Published detail or null. Never falls back to a draft for public readers. */
export async function getProject(slug: string, mode: ReadMode = PUBLIC_MODE): Promise<ProjectDetailDTO | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    ...readArgs(mode),
    where: { slug: { equals: slug } },
    limit: 1,
    pagination: false,
  })
  const doc = result.docs[0]
  if (!doc || !isPublishedOrPreview(doc, mode)) return null
  return toProjectDetail(payload, doc, mode)
}

/** Draft preview by ID (the draft may not have a slug yet). Requires an authenticated preview mode. */
export async function getProjectForPreview(id: number, mode: ReadMode): Promise<ProjectDetailDTO | null> {
  if (!mode.draft || !mode.user) return null
  const payload = await getPayloadClient()
  const doc = await payload.findByID({ collection: 'projects', id, ...readArgs(mode), disableErrors: true })
  if (!doc) return null
  return toProjectDetail(payload, { ...doc, slug: doc.slug ?? '' }, mode)
}

/** Resolves a historical project URL to the project's current published URL. */
export async function getProjectRedirect(slug: string): Promise<string | null> {
  const payload = await getPayloadClient()
  const redirect = await payload.find({
    collection: 'redirects',
    where: { fromPath: { equals: projectPath(slug) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const projectId = relationId(redirect.docs[0]?.project)
  if (projectId === null) return null
  const target = await payload.find({
    collection: 'projects',
    ...readArgs(PUBLIC_MODE),
    where: { id: { equals: projectId } },
    limit: 1,
    pagination: false,
  })
  const project = target.docs[0]
  if (!project || project._status !== 'published' || !project.slug || project.slug === slug) return null
  return projectPath(project.slug)
}

export async function getNextProject(id: number, mode: ReadMode = PUBLIC_MODE): Promise<ProjectSummaryDTO | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    ...readArgs(mode),
    sort: PROJECT_SORT,
    pagination: false,
  })
  const docs = result.docs.filter((doc) => isPublishedOrPreview(doc, mode) && doc.slug)
  const index = docs.findIndex((doc) => doc.id === id)
  const next = index >= 0 ? docs[index + 1] : undefined
  return next ? toProjectSummary(next) : null
}

export async function getSitemapProjects(): Promise<Array<{ slug: string; updatedAt: string }>> {
  const payload = await getPayloadClient()
  const result = await payload.find({ collection: 'projects', ...readArgs(PUBLIC_MODE), sort: PROJECT_SORT, pagination: false })
  return result.docs
    .filter((doc) => doc._status === 'published' && doc.slug)
    .map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt }))
}

// ---------------------------------------------------------------------------
// Experience, skills, education
// ---------------------------------------------------------------------------

export async function getExperiences(mode: ReadMode = PUBLIC_MODE): Promise<ExperienceDTO[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({ collection: 'experiences', ...readArgs(mode), sort: ['sortOrder', 'id'], pagination: false })
  const docs = result.docs.filter((doc) => isPublishedOrPreview(doc, mode))
  const skills = await resolveSkills(
    payload,
    docs.flatMap((doc) => (doc.engagements ?? []).flatMap((engagement) => (engagement.technologies ?? []).map(relationId))),
    mode,
  )
  return docs.map((doc) => ({
    id: doc.id,
    organization: doc.organization,
    location: text(doc.location),
    workModeLabel: doc.workMode ? WORK_MODE_LABELS[doc.workMode] : null,
    engagements: (doc.engagements ?? []).map((engagement) => ({
      role: engagement.role,
      employmentTypeLabel: EMPLOYMENT_LABELS[engagement.employmentType] ?? '',
      period: formatPeriod(engagement.startMonth, engagement.endMonth, Boolean(engagement.isCurrent)) ?? '',
      isCurrent: Boolean(engagement.isCurrent),
      summary: text(engagement.summary),
      contributions: (engagement.contributions ?? []).map((item) => item.text).filter(Boolean),
      technologies: skillNames(engagement.technologies, skills),
      overlapNote: text(engagement.overlapNote),
    })),
  }))
}

export async function getSkillGroups(mode: ReadMode = PUBLIC_MODE): Promise<SkillGroupDTO[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({ collection: 'skills', ...readArgs(mode), sort: ['sortOrder', 'id'], pagination: false })
  const docs = result.docs.filter((doc) => isPublishedOrPreview(doc, mode))
  return SKILL_GROUPS.map(({ label, value }) => ({
    group: value,
    label,
    skills: docs.filter((doc) => doc.group === value).map((doc) => doc.name),
  })).filter((group) => group.skills.length > 0)
}

export async function getEducation(mode: ReadMode = PUBLIC_MODE): Promise<EducationDTO[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({ collection: 'education', ...readArgs(mode), sort: ['sortOrder', 'id'], pagination: false })
  return result.docs
    .filter((doc) => isPublishedOrPreview(doc, mode))
    .map((doc: Education) => ({
      id: doc.id,
      institution: doc.institution,
      qualification: doc.qualification,
      field: doc.field,
      years: `${doc.startYear} – ${doc.endYear}`,
      gpa: text(doc.gpa),
      thesisTitle: text(doc.thesisTitle),
      notes: text(doc.notes),
    }))
}
