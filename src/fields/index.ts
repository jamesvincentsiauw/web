import type {
  CheckboxField,
  Field,
  FieldHook,
  NumberField,
  RelationshipField,
  RichTextField,
  TextField,
  TextareaField,
  UploadField,
  Validate,
} from 'payload'

import { internalFieldAccess } from '../access'
import {
  compareMonths,
  findUnsafeRichTextLinks,
  isHttpUrl,
  isValidMonth,
  relationId,
  richTextHasContent,
} from '../lib/validation'

export const trimHook: FieldHook = ({ value }) => (typeof value === 'string' ? value.trim() : value)

type TextOptions = { label?: string; required?: boolean; maxLength?: number; description?: string; width?: string }

export function textField(name: string, options: TextOptions = {}): TextField {
  return {
    name,
    type: 'text',
    label: options.label,
    required: options.required,
    maxLength: options.maxLength,
    hooks: { beforeValidate: [trimHook] },
    admin: { description: options.description, width: options.width },
  }
}

export function textareaField(name: string, options: TextOptions = {}): TextareaField {
  return {
    name,
    type: 'textarea',
    label: options.label,
    required: options.required,
    maxLength: options.maxLength,
    hooks: { beforeValidate: [trimHook] },
    admin: { description: options.description },
  }
}

export function urlField(name: string, options: TextOptions = {}): TextField {
  return {
    ...textField(name, options),
    validate: ((value: unknown) => {
      if (!value) return options.required ? 'A URL is required.' : true
      return isHttpUrl(value) || 'Use a full http:// or https:// URL.'
    }) as Validate,
  }
}

/** Month stored as YYYY-MM text so timezone conversion never changes it. */
export function monthField(
  name: string,
  options: { label: string; required?: boolean; notBefore?: string; description?: string },
): TextField {
  return {
    name,
    type: 'text',
    label: options.label,
    required: options.required,
    hooks: { beforeValidate: [trimHook] },
    admin: { placeholder: 'YYYY-MM', width: '50%', description: options.description },
    validate: ((value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
      if (!value) return options.required ? `${options.label} is required.` : true
      if (!isValidMonth(value)) return 'Use YYYY-MM with a real month, for example 2024-10.'
      const lowerBound = options.notBefore ? siblingData?.[options.notBefore] : undefined
      if (isValidMonth(lowerBound) && compareMonths(value, lowerBound) < 0) {
        return 'End month cannot be before the start month.'
      }
      return true
    }) as Validate,
  }
}

export function sortOrderField(): NumberField {
  return {
    name: 'sortOrder',
    type: 'number',
    defaultValue: 100,
    required: true,
    admin: {
      position: 'sidebar',
      step: 1,
      description: 'Lower numbers appear first. Ties are ordered by ID.',
    },
    validate: ((value: unknown) =>
      (typeof value === 'number' && Number.isInteger(value)) || 'Use a whole number.') as Validate,
  }
}

export function contentReadyField(): CheckboxField {
  return {
    name: 'contentReady',
    type: 'checkbox',
    label: 'Content reviewed and ready to publish',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description: 'Editorial confirmation required to publish. It does not control who can see the entry.',
    },
    validate: ((value: unknown) =>
      value === true || 'Confirm the content is reviewed before publishing.') as Validate,
  }
}

export function internalTextField(name: string, label: string, description: string): TextareaField {
  return {
    name,
    type: 'textarea',
    label,
    access: internalFieldAccess,
    admin: { position: 'sidebar', description },
  }
}

export function richTextField(
  name: string,
  options: { label: string; required?: boolean; description?: string },
): RichTextField {
  return {
    name,
    type: 'richText',
    label: options.label,
    required: options.required,
    admin: { description: options.description },
    validate: ((value: unknown) => {
      if (options.required && !richTextHasContent(value)) return `${options.label} is required to publish.`
      const unsafe = findUnsafeRichTextLinks(value)
      if (unsafe.length) return `Links must be http, https, or mailto. Fix: ${unsafe[0]}`
      return true
    }) as Validate,
  }
}

type MediaDoc = {
  mimeType?: string | null
  visibility?: string | null
  contentReady?: boolean | null
  decorative?: boolean | null
}

/** Publish-time check that a referenced media file can actually be shown publicly. */
export function publicMediaValidate(kind: 'image' | 'pdf', options: { allowDecorative?: boolean } = {}): Validate {
  return (async (value: unknown, { req }: { req: { payload: import('payload').Payload } }) => {
    const id = relationId(value)
    if (id === null) return true
    const media = (await req.payload.findByID({
      collection: 'media',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
      req: req as never,
    })) as MediaDoc | null
    if (!media) return 'The selected file no longer exists.'
    const isPdf = media.mimeType === 'application/pdf'
    if (kind === 'pdf' && !isPdf) return 'Select a PDF file.'
    if (kind === 'image' && isPdf) return 'Select an image file.'
    if (media.visibility !== 'public' || media.contentReady !== true) {
      return 'Set the file visibility to Public and mark it ready before publishing.'
    }
    if (kind === 'image' && media.decorative && !options.allowDecorative) {
      return 'Decorative images cannot be used here. Add alt text and unmark Decorative.'
    }
    return true
  }) as Validate
}

export function mediaUploadField(name: string, options: { label: string; kind: 'image' | 'pdf'; description?: string }): UploadField {
  return {
    name,
    type: 'upload',
    relationTo: 'media',
    label: options.label,
    admin: { description: options.description },
    filterOptions: options.kind === 'pdf' ? { mimeType: { equals: 'application/pdf' } } : { mimeType: { contains: 'image/' } },
    validate: publicMediaValidate(options.kind),
  }
}

/** Hidden, hook-maintained list of every media ID the document references (TRD §5 media delivery). */
export function mediaRefsField(): RelationshipField {
  return {
    name: 'mediaRefs',
    type: 'relationship',
    relationTo: 'media',
    hasMany: true,
    access: { read: internalFieldAccess.read },
    admin: { hidden: true },
  }
}

export function skillsField(name: string, label: string): RelationshipField {
  return {
    name,
    type: 'relationship',
    relationTo: 'skills',
    hasMany: true,
    label,
    admin: { description: 'Unpublished skills are hidden from public pages.' },
  }
}

export type { Field }
