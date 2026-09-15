import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { safeExitPath } from '@/lib/preview'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  ;(await draftMode()).disable()
  redirect(safeExitPath(new URL(request.url).searchParams.get('path')))
}
