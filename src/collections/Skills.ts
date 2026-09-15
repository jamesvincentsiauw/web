import type { CollectionConfig } from 'payload'

import { adminOnly, publishedOrAdmin } from '../access'
import { contentReadyField, sortOrderField, textField } from '../fields'
import { requireDraftRestore } from '../hooks/requireDraftRestore'
import { previewURL } from '../lib/preview-url'

export const SKILL_GROUPS = [
  { label: 'Languages & frameworks', value: 'languages-frameworks' },
  { label: 'AI', value: 'ai' },
  { label: 'Backend & architecture', value: 'backend' },
  { label: 'Data', value: 'data' },
  { label: 'Messaging & streaming', value: 'messaging' },
  { label: 'Infrastructure', value: 'infrastructure' },
] as const

export const Skills: CollectionConfig = {
  slug: 'skills',
  labels: { singular: 'Skill', plural: 'Skills' },
  defaultSort: 'sortOrder',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'group', '_status', 'sortOrder'],
    preview: (doc) => previewURL({ collection: 'skills', id: doc.id as number }),
    description: 'Names grouped by domain. No ratings or percentages.',
  },
  access: {
    read: publishedOrAdmin,
    readVersions: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  hooks: { beforeOperation: [requireDraftRestore] },
  fields: [
    { ...textField('name', { required: true, maxLength: 60 }), unique: true },
    { name: 'group', type: 'select', required: true, options: [...SKILL_GROUPS] },
    sortOrderField(),
    contentReadyField(),
  ],
}
