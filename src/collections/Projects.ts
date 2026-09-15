import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig, PayloadRequest } from 'payload'
import { ValidationError } from 'payload'

import { adminOnly, internalFieldAccess, publishedOrAdmin } from '../access'
import {
  contentReadyField,
  internalTextField,
  mediaRefsField,
  mediaUploadField,
  monthField,
  richTextField,
  skillsField,
  sortOrderField,
  textField,
  textareaField,
  urlField,
} from '../fields'
import { requireDraftRestore } from '../hooks/requireDraftRestore'
import { previewURL } from '../lib/preview-url'
import { collectRichTextUploadIds, relationId, slugError, slugify, uniqueIds } from '../lib/validation'

export const MAX_FEATURED_PROJECTS = 3

export const projectPath = (slug: string) => `/projects/${slug}`

const RICH_TEXT_FIELDS = ['context', 'contribution', 'decisions', 'outcome'] as const

type ProjectData = Record<string, unknown> & {
  id?: number
  slug?: string | null
  title?: string | null
  featured?: boolean | null
  _status?: 'draft' | 'published' | null
  cover?: unknown
  gallery?: Array<{ image?: unknown }> | null
  seo?: { image?: unknown } | null
}

const fillSlug: CollectionBeforeValidateHook = ({ data }) => {
  if (data && !data.slug && typeof data.title === 'string' && data.title.trim()) {
    data.slug = slugify(data.title)
  }
  return data
}

const slugValidationError = (message: string) =>
  new ValidationError({ collection: 'projects', errors: [{ path: 'slug', message }] })

/**
 * Keeps redirects in step with the published slug. Redirects always point at the project, and the
 * public route resolves the project's current slug, so old URLs never chain or loop.
 */
async function syncRedirects(req: PayloadRequest, projectId: number, previousSlug: string | null, slug: string) {
  const currentPath = projectPath(slug)

  // A project returning to an earlier slug must not keep a redirect away from that slug.
  await req.payload.delete({
    collection: 'redirects',
    where: { and: [{ fromPath: { equals: currentPath } }, { project: { equals: projectId } }] },
    overrideAccess: true,
    req,
  })

  if (previousSlug && previousSlug !== slug) {
    const fromPath = projectPath(previousSlug)
    const existing = await req.payload.find({
      collection: 'redirects',
      where: { fromPath: { equals: fromPath } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (existing.docs[0]) {
      await req.payload.update({ collection: 'redirects', id: existing.docs[0].id, data: { project: projectId, toPath: currentPath }, overrideAccess: true, req })
    } else {
      await req.payload.create({ collection: 'redirects', data: { fromPath, project: projectId, toPath: currentPath }, overrideAccess: true, req })
    }
  }

  await req.payload.update({
    collection: 'redirects',
    where: { project: { equals: projectId } },
    data: { toPath: currentPath },
    overrideAccess: true,
    req,
  })
}

const guardProject: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const merged: ProjectData = { ...(originalDoc ?? {}), ...data }
  const id = originalDoc?.id as number | undefined
  const status = data._status ?? originalDoc?._status

  data.mediaRefs = uniqueIds([
    relationId(merged.cover),
    relationId(merged.seo?.image),
    ...(merged.gallery ?? []).map((item) => relationId(item?.image)),
    ...RICH_TEXT_FIELDS.flatMap((field) => collectRichTextUploadIds(merged[field])),
  ])

  // Restores only ever produce drafts (requireDraftRestore). Payload 3.89 passes a restore request
  // that cannot be reused for nested Local API calls; publishing the restored draft runs the full guard.
  if (req.context?.isRestoringVersion) return data

  const slug = typeof merged.slug === 'string' ? merged.slug : ''
  if (slug) {
    const notThisProject = id ? [{ id: { not_equals: id } }] : []
    const [slugOwner, historicalRedirect] = await Promise.all([
      req.payload.find({
        collection: 'projects',
        where: { and: [{ slug: { equals: slug } }, ...notThisProject] },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      }),
      req.payload.find({
        collection: 'redirects',
        where: { and: [{ fromPath: { equals: projectPath(slug) } }, ...(id ? [{ project: { not_equals: id } }] : [])] },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      }),
    ])
    if (slugOwner.totalDocs > 0) throw slugValidationError('Another project already uses this slug.')
    if (historicalRedirect.totalDocs > 0) {
      throw slugValidationError('This URL previously belonged to another project and still redirects there.')
    }
  }

  if (status !== 'published') return data

  const slugProblem = slugError(slug)
  if (slugProblem) throw slugValidationError(slugProblem)

  if (merged.featured) {
    const otherFeatured = await req.payload.count({
      collection: 'projects',
      where: {
        and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }, ...(id ? [{ id: { not_equals: id } }] : [])],
      },
      overrideAccess: true,
      req,
    })
    if (otherFeatured.totalDocs >= MAX_FEATURED_PROJECTS) {
      throw new ValidationError({
        collection: 'projects',
        errors: [{ path: 'featured', message: `Only ${MAX_FEATURED_PROJECTS} published projects can be featured. Unfeature another project first.` }],
      })
    }
  }

  if (id) {
    // The main table row holds the currently published snapshot; draft saves never touch it.
    const live = (await req.payload.db.findOne({ collection: 'projects', where: { id: { equals: id } }, req })) as ProjectData | null
    const previousSlug = live?._status === 'published' && live.slug ? live.slug : null
    await syncRedirects(req, id, previousSlug, slug)
  }
  return data
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Project', plural: 'Projects' },
  defaultSort: 'sortOrder',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'organization', '_status', 'featured', 'sortOrder', 'updatedAt'],
    listSearchableFields: ['title', 'organization', 'slug'],
    preview: (doc) => previewURL({ collection: 'projects', id: doc.id as number }),
    description: 'Case studies. Save drafts freely; publishing requires the full case study and content confirmation.',
  },
  access: {
    read: publishedOrAdmin,
    readVersions: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: {
    beforeOperation: [requireDraftRestore],
    beforeValidate: [fillSlug],
    beforeChange: [guardProject],
    // Redirects must go first: their required project reference cannot be nulled by the FK.
    beforeDelete: [
      async ({ id, req }) => {
        await req.payload.delete({ collection: 'redirects', where: { project: { equals: id } }, overrideAccess: true, req })
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            textField('title', { required: true, maxLength: 100 }),
            {
              name: 'slug',
              type: 'text',
              unique: true,
              index: true,
              required: true,
              maxLength: 80,
              admin: { description: 'Lowercase kebab-case, used in /projects/<slug>. Generated from the title when empty.' },
              hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)] },
              validate: (value: unknown) => slugError(value) ?? true,
            },
            textareaField('summary', { required: true, maxLength: 240, description: 'One or two sentences: the problem and your contribution.' }),
            {
              type: 'row',
              fields: [
                {
                  name: 'category',
                  type: 'select',
                  required: true,
                  admin: { width: '50%' },
                  options: [
                    { label: 'AI workflows', value: 'ai-workflows' },
                    { label: 'Data infrastructure', value: 'data-infrastructure' },
                    { label: 'Product engineering', value: 'product-engineering' },
                    { label: 'Research', value: 'research' },
                  ],
                },
                {
                  name: 'projectType',
                  type: 'select',
                  required: true,
                  defaultValue: 'professional',
                  admin: { width: '50%' },
                  options: [
                    { label: 'Professional', value: 'professional' },
                    { label: 'Personal', value: 'personal' },
                    { label: 'Academic', value: 'academic' },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                textField('organization', { maxLength: 100, width: '50%', description: 'Text only. Logos are not shown.' }),
                { name: 'experience', type: 'relationship', relationTo: 'experiences', admin: { width: '50%' } },
              ],
            },
            textField('role', { required: true, maxLength: 140, description: 'Your role on this project.' }),
            {
              type: 'row',
              fields: [
                monthField('startMonth', { label: 'Start month' }),
                monthField('endMonth', { label: 'End month', notBefore: 'startMonth' }),
              ],
            },
          ],
        },
        {
          label: 'Case Study',
          fields: [
            richTextField('context', { label: 'Context', required: true, description: 'The problem, users, and constraints.' }),
            richTextField('contribution', { label: 'Contribution', required: true, description: 'What you personally did, separate from the team.' }),
            richTextField('decisions', { label: 'Decisions', required: true, description: 'Technical choices and their tradeoffs.' }),
            richTextField('outcome', { label: 'Outcome', required: true, description: 'Narrative result. Numbers are optional.' }),
            {
              name: 'metrics',
              type: 'array',
              labels: { singular: 'Metric', plural: 'Metrics' },
              admin: { description: 'Optional. Only add numbers whose context you can state.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    textField('valueText', { label: 'Value', required: true, maxLength: 20, width: '30%' }),
                    textField('label', { required: true, maxLength: 80, width: '70%' }),
                  ],
                },
                textField('context', { required: true, maxLength: 200, description: 'What was measured, when, and against what baseline.' }),
                {
                  name: 'sourceNote',
                  type: 'textarea',
                  label: 'Source note (internal)',
                  access: internalFieldAccess,
                },
              ],
            },
          ],
        },
        {
          label: 'Media & Links',
          fields: [
            skillsField('technologies', 'Technologies'),
            mediaUploadField('cover', { label: 'Cover image', kind: 'image', description: 'Optional. Leave empty rather than using a placeholder.' }),
            {
              name: 'gallery',
              type: 'array',
              fields: [
                mediaUploadField('image', { label: 'Image', kind: 'image' }),
                textField('caption', { maxLength: 200, description: 'Say whether a diagram is conceptual or the actual architecture.' }),
              ],
            },
            {
              name: 'links',
              type: 'array',
              admin: { description: 'Only add links that exist and are public.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'kind',
                      type: 'select',
                      required: true,
                      admin: { width: '30%' },
                      options: [
                        { label: 'Source', value: 'source' },
                        { label: 'Demo', value: 'demo' },
                        { label: 'Article', value: 'article' },
                      ],
                    },
                    textField('label', { required: true, maxLength: 60, width: '70%' }),
                  ],
                },
                urlField('url', { required: true }),
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: false,
              fields: [
                textField('title', { maxLength: 60, description: 'Defaults to the project title.' }),
                textareaField('description', { maxLength: 160, description: 'Defaults to the summary.' }),
                mediaUploadField('image', { label: 'Social image', kind: 'image' }),
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: `Show on the homepage. At most ${MAX_FEATURED_PROJECTS} published.` },
    },
    sortOrderField(),
    contentReadyField(),
    internalTextField('internalSource', 'Internal source', 'Where the facts come from. Never shown publicly.'),
    internalTextField('internalNotes', 'Internal notes', 'Open questions and publication notes. Never shown publicly.'),
    mediaRefsField(),
  ],
}
