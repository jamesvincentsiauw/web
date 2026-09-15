import type { CollectionConfig, Validate } from 'payload'

import { adminOnly, publishedOrAdmin } from '../access'
import { contentReadyField, sortOrderField, textField, textareaField } from '../fields'
import { requireDraftRestore } from '../hooks/requireDraftRestore'
import { previewURL } from '../lib/preview-url'

const yearValidate =
  (label: string, notBefore?: string): Validate =>
  ((value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
    if (value === null || value === undefined) return `${label} is required.`
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1950 || value > 2100) {
      return 'Use a four-digit year.'
    }
    const lower = notBefore ? siblingData?.[notBefore] : undefined
    if (typeof lower === 'number' && value < lower) return 'End year cannot be before the start year.'
    return true
  }) as Validate

export const Education: CollectionConfig = {
  slug: 'education',
  labels: { singular: 'Education', plural: 'Education' },
  defaultSort: 'sortOrder',
  admin: {
    useAsTitle: 'institution',
    defaultColumns: ['institution', 'qualification', '_status', 'sortOrder'],
    preview: (doc) => previewURL({ collection: 'education', id: doc.id as number }),
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
    textField('institution', { required: true, maxLength: 120 }),
    {
      type: 'row',
      fields: [
        textField('qualification', { required: true, maxLength: 100, width: '50%' }),
        textField('field', { required: true, maxLength: 100, width: '50%' }),
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startYear', type: 'number', required: true, admin: { width: '50%', step: 1 }, validate: yearValidate('Start year') },
        { name: 'endYear', type: 'number', required: true, admin: { width: '50%', step: 1 }, validate: yearValidate('End year', 'startYear') },
      ],
    },
    textField('gpa', { label: 'GPA', maxLength: 20, description: 'Optional. Shown on the About page only.' }),
    textField('thesisTitle', { maxLength: 200 }),
    textareaField('notes', { maxLength: 400 }),
    sortOrderField(),
    contentReadyField(),
  ],
}
