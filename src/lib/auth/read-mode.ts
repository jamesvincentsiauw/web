import { draftMode, headers } from 'next/headers'

import { isAdminUser } from '../../access'
import type { User } from '../../payload-types'
import { PUBLIC_MODE, type ReadMode } from '../content/types'
import { getPayloadClient } from '../payload'

/**
 * Draft Mode alone is not authorization: every request re-validates the admin session, so logging
 * out (or an expired session) immediately returns the reader to published content.
 */
export async function getReadMode(): Promise<ReadMode> {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return PUBLIC_MODE
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!isAdminUser(user)) return PUBLIC_MODE
  return { draft: true, user: user as User }
}
