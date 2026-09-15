import type { GlobalConfig, Validate } from 'payload'

import { adminOnly, publishedOrAdmin } from '../access'
import {
  contentReadyField,
  mediaRefsField,
  mediaUploadField,
  richTextField,
  textField,
  textareaField,
  urlField,
} from '../fields'
import { previewURL } from '../lib/preview-url'
import { collectRichTextUploadIds, relationId, uniqueIds } from '../lib/validation'

export const Profile: GlobalConfig = {
  slug: 'profile',
  label: 'Profile',
  admin: {
    preview: () => previewURL({ global: 'profile' }),
    description: 'Identity, hero copy, bio, and contact details.',
  },
  access: {
    read: publishedOrAdmin,
    readVersions: adminOnly,
    update: adminOnly,
  },
  versions: { drafts: true, max: 50 },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const merged = { ...(originalDoc ?? {}), ...data }
        data.mediaRefs = uniqueIds([relationId(merged.resume), ...collectRichTextUploadIds(merged.fullBio)])
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            textField('displayName', { required: true, maxLength: 80 }),
            textField('roleLabel', { label: 'Role label', required: true, maxLength: 100 }),
            textField('heroHeading', { required: true, maxLength: 110 }),
            textareaField('heroIntro', { required: true, maxLength: 280, description: 'Two sentences at most.' }),
            textField('location', { maxLength: 100 }),
          ],
        },
        {
          label: 'Bio',
          fields: [
            textareaField('shortBio', { maxLength: 600, description: 'Shown on the homepage.' }),
            richTextField('fullBio', { label: 'Full bio', description: 'Shown on the About page.' }),
            textField('availabilityText', { maxLength: 160, description: 'Optional. Leave empty unless current.' }),
            textField('relocationText', { maxLength: 240 }),
            {
              name: 'spokenLanguages',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    textField('name', { required: true, maxLength: 40, width: '50%' }),
                    textField('proficiency', { required: true, maxLength: 40, width: '50%' }),
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Contact & CV',
          fields: [
            {
              name: 'email',
              type: 'email',
              required: true,
            },
            {
              name: 'socialLinks',
              type: 'array',
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
                        { label: 'GitHub', value: 'github' },
                        { label: 'LinkedIn', value: 'linkedin' },
                        { label: 'Other', value: 'other' },
                      ],
                    },
                    textField('label', { required: true, maxLength: 40, width: '70%' }),
                  ],
                },
                urlField('url', { required: true }),
              ],
            },
            {
              ...mediaUploadField('resume', {
                label: 'Public CV (PDF)',
                kind: 'pdf',
                description: 'Upload the public version (no phone number). The download button is hidden until this is set.',
              }),
            },
          ],
        },
      ],
    },
    {
      ...contentReadyField(),
      validate: ((value: unknown) => value === true || 'Confirm the profile is reviewed before publishing.') as Validate,
    },
    mediaRefsField(),
  ],
}
