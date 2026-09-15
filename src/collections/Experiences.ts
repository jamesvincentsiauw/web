import type { CollectionConfig, Validate } from 'payload'

import { adminOnly, publishedOrAdmin } from '../access'
import {
  contentReadyField,
  internalTextField,
  monthField,
  skillsField,
  sortOrderField,
  textField,
  textareaField,
} from '../fields'
import { requireDraftRestore } from '../hooks/requireDraftRestore'
import { previewURL } from '../lib/preview-url'
import { compareMonths, isValidMonth } from '../lib/validation'

export const Experiences: CollectionConfig = {
  slug: 'experiences',
  labels: { singular: 'Experience', plural: 'Experiences' },
  defaultSort: 'sortOrder',
  admin: {
    useAsTitle: 'organization',
    defaultColumns: ['organization', '_status', 'sortOrder', 'updatedAt'],
    preview: (doc) => previewURL({ collection: 'experiences', id: doc.id as number }),
    description: 'One entry per company. Add freelance and full-time periods as separate engagements.',
  },
  access: {
    read: publishedOrAdmin,
    readVersions: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: { beforeOperation: [requireDraftRestore] },
  fields: [
    textField('organization', { required: true, maxLength: 100 }),
    {
      type: 'row',
      fields: [
        textField('location', { maxLength: 100, width: '50%' }),
        {
          name: 'workMode',
          type: 'select',
          admin: { width: '50%' },
          options: [
            { label: 'Remote', value: 'remote' },
            { label: 'Hybrid', value: 'hybrid' },
            { label: 'On-site', value: 'onsite' },
          ],
        },
      ],
    },
    {
      name: 'engagements',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Engagement', plural: 'Engagements' },
      admin: { description: 'Newest first. The homepage shows the first engagement.' },
      fields: [
        {
          type: 'row',
          fields: [
            textField('role', { required: true, maxLength: 100, width: '50%' }),
            {
              name: 'employmentType',
              type: 'select',
              required: true,
              admin: { width: '50%' },
              options: [
                { label: 'Full-time', value: 'full-time' },
                { label: 'Part-time', value: 'part-time' },
                { label: 'Contract', value: 'contract' },
                { label: 'Freelance', value: 'freelance' },
                { label: 'Internship', value: 'internship' },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            monthField('startMonth', { label: 'Start month', required: true }),
            {
              ...monthField('endMonth', { label: 'End month', notBefore: 'startMonth' }),
              admin: { placeholder: 'YYYY-MM', width: '50%', condition: (_, sibling) => !sibling?.isCurrent },
              validate: ((value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
                if (siblingData?.isCurrent) return value ? 'A current engagement has no end month.' : true
                if (!value) return 'End month is required unless this is the current engagement.'
                if (!isValidMonth(value)) return 'Use YYYY-MM with a real month, for example 2024-10.'
                if (isValidMonth(siblingData?.startMonth) && compareMonths(value, siblingData.startMonth) < 0) {
                  return 'End month cannot be before the start month.'
                }
                return true
              }) as Validate,
            },
          ],
        },
        {
          name: 'isCurrent',
          type: 'checkbox',
          label: 'Current engagement',
          defaultValue: false,
          hooks: {
            beforeChange: [
              ({ value, siblingData }) => {
                if (value && siblingData) siblingData.endMonth = null
                return value
              },
            ],
          },
        },
        textareaField('summary', { maxLength: 400 }),
        {
          name: 'contributions',
          type: 'array',
          labels: { singular: 'Contribution', plural: 'Contributions' },
          admin: { description: 'The first contribution appears on the homepage.' },
          fields: [textareaField('text', { label: 'Contribution', required: true, maxLength: 400 })],
        },
        skillsField('technologies', 'Technologies'),
        textField('overlapNote', {
          maxLength: 160,
          description: 'For concurrent engagements, e.g. "Concurrent with Offerland freelance engagement".',
        }),
      ],
    },
    sortOrderField(),
    contentReadyField(),
    internalTextField('internalSource', 'Internal source', 'Source of these facts and unpublished caveats. Never shown publicly.'),
  ],
}
