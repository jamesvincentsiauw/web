import type { CollectionConfig, Validate } from 'payload'

import { adminOnly } from '../access'
import { isSafeInternalPath } from '../lib/validation'

const internalPath = ((value: unknown) => isSafeInternalPath(value) || 'Use an internal path starting with /.') as Validate

/**
 * System collection maintained by Projects hooks when a published slug changes. Redirects always
 * resolve to the target project's *current* slug at request time, so chains and loops cannot form.
 */
export const Redirects: CollectionConfig = {
  slug: 'redirects',
  admin: {
    useAsTitle: 'fromPath',
    group: 'System',
    defaultColumns: ['fromPath', 'toPath', 'project', 'createdAt'],
    description: 'Created automatically when a published project slug changes.',
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'fromPath', type: 'text', required: true, unique: true, index: true, validate: internalPath },
    { name: 'toPath', type: 'text', required: true, validate: internalPath, admin: { readOnly: true } },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true },
  ],
}
