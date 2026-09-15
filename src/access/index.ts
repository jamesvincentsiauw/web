import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

export function isAdminUser(user: PayloadRequest['user'] | null | undefined): boolean {
  return Boolean(user && user.collection === 'users' && (user as { role?: string }).role === 'admin')
}

export const adminOnly: Access = ({ req }) => isAdminUser(req.user)

/** Anonymous callers only ever match the published snapshot; admins read everything. */
export const publishedOrAdmin: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  const publishedOnly: Where = { _status: { equals: 'published' } }
  return publishedOnly
}

export const adminFieldAccess: FieldAccess = ({ req }) => isAdminUser(req.user)

export const internalFieldAccess = {
  read: adminFieldAccess,
  create: adminFieldAccess,
  update: adminFieldAccess,
}
