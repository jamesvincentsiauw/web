import type { CollectionConfig } from 'payload'

import { adminFieldAccess, adminOnly } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'System',
  },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
    forgotPassword: {
      expiration: 60 * 60 * 1000,
    },
  },
  // No public signup. The first admin is created once via `pnpm create-admin` (or Payload's
  // first-user screen, which only works while the users table is empty).
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
    unlock: adminOnly,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [{ label: 'Admin', value: 'admin' }],
      saveToJWT: true,
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
    },
  ],
}
