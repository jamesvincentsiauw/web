import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/** Verifies the app can reach the database. Returns no content details. */
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'users', overrideAccess: true })
    return Response.json({ status: 'ok' }, { headers })
  } catch (error) {
    console.error('[healthz] database check failed', (error as Error).message)
    return Response.json({ status: 'unavailable' }, { status: 503, headers })
  }
}
