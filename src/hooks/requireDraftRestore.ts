import type { CollectionBeforeOperationHook } from 'payload'
import { APIError } from 'payload'

/**
 * AC-12: restoring a version must create a draft for review, never publish directly.
 * REST restores are forced to draft=true in src/lib/payload-rest.ts. Payload's Local API restoreVersion
 * does not forward `draft` (3.89), so Local API restores are refused rather than published.
 */
export const requireDraftRestore: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation === 'restoreVersion' && (args as { draft?: boolean }).draft !== true) {
    throw new APIError('Versions are restored as drafts. Review the draft, then publish it explicitly.', 400)
  }
  return args
}
