import { randomUUID } from 'crypto'
import type { CollectionConfig, Validate } from 'payload'
import { ValidationError } from 'payload'

import { adminOnly, internalFieldAccess } from '../access'
import { textField } from '../fields'
import { UPLOAD_RULES, checkUpload, safeDownloadName } from '../lib/validation'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media' },
  admin: {
    useAsTitle: 'downloadName',
    defaultColumns: ['filename', 'downloadName', 'kind', 'visibility', 'contentReady', 'updatedAt'],
    description:
      'Files are private by default. Public files are only served when marked ready and referenced by published content.',
  },
  // No anonymous REST access, including /api/media/file/*. Public delivery goes through /media/[id].
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  upload: {
    mimeTypes: Object.keys(UPLOAD_RULES),
    // Derivatives are not generated; originals are served through the same access check.
    imageSizes: [],
  },
  hooks: {
    beforeOperation: [
      ({ args, operation, req }) => {
        if ((operation === 'create' || operation === 'update') && req.file) {
          const result = checkUpload(req.file)
          if (!result.ok) {
            throw new ValidationError({ collection: 'media', errors: [{ path: 'file', message: result.message }] })
          }
          if (args.data && !args.data.downloadName) {
            args.data.downloadName = safeDownloadName(req.file.name, result.storedExtension)
          }
          // Opaque object name; the friendly name only lives in downloadName.
          req.file.name = `${randomUUID()}.${result.storedExtension}`
        }
        return args
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (typeof data.mimeType === 'string') {
          data.kind = data.mimeType === 'application/pdf' ? 'pdf' : 'image'
        }
        return data
      },
    ],
  },
  fields: [
    textField('alt', {
      label: 'Alt text',
      maxLength: 200,
      description: 'Describe what the image shows. Required for images unless marked decorative.',
    }),
    {
      name: 'decorative',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Decorative images have empty alt text and cannot be used as covers.' },
      validate: ((value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
        const isImage = typeof siblingData?.mimeType === 'string' && siblingData.mimeType.startsWith('image/')
        const hasAlt = typeof siblingData?.alt === 'string' && siblingData.alt.trim().length > 0
        if (isImage && !value && !hasAlt) return 'Add alt text or mark the image as decorative.'
        return true
      }) as Validate,
    },
    textField('caption', { maxLength: 200 }),
    textField('downloadName', {
      label: 'Download file name',
      maxLength: 100,
      description: 'Friendly name used when the file is downloaded, e.g. Vincent-Siauw-CV.pdf.',
    }),
    {
      name: 'kind',
      type: 'select',
      options: [
        { label: 'Image', value: 'image' },
        { label: 'PDF', value: 'pdf' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'private',
      options: [
        { label: 'Private', value: 'private' },
        { label: 'Public', value: 'public' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'contentReady',
      type: 'checkbox',
      label: 'Ready to be shown publicly',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      access: internalFieldAccess,
      admin: { position: 'sidebar', description: 'Never shown publicly.' },
    },
  ],
}
