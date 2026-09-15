import type { GlobalConfig } from 'payload'

import { adminOnly, publishedOrAdmin } from '../access'
import { contentReadyField, mediaRefsField, mediaUploadField, textField, textareaField } from '../fields'
import { previewURL } from '../lib/preview-url'
import { relationId, uniqueIds } from '../lib/validation'

/** Editorial settings only. Origin, layout, theme tokens, scripts, and CSS stay in source code. */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    preview: () => previewURL({ global: 'site-settings' }),
  },
  access: {
    read: publishedOrAdmin,
    readVersions: adminOnly,
    update: adminOnly,
  },
  versions: { drafts: true, max: 20 },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const merged = { ...(originalDoc ?? {}), ...data }
        data.mediaRefs = uniqueIds([relationId(merged.socialImage)])
        return data
      },
    ],
  },
  fields: [
    textField('siteName', { required: true, maxLength: 80 }),
    textField('defaultSeoTitle', { label: 'Default SEO title', required: true, maxLength: 60 }),
    textareaField('defaultSeoDescription', { label: 'Default SEO description', required: true, maxLength: 160 }),
    mediaUploadField('socialImage', {
      label: 'Social image',
      kind: 'image',
      description: 'Optional. A simple generated image with name and title is used when empty.',
    }),
    textField('footerText', { maxLength: 160 }),
    contentReadyField(),
    mediaRefsField(),
  ],
}
