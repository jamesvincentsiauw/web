import config from '@payload-config'
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import { getPayload, type Payload } from 'payload'

import { withDraftRestore } from '@/lib/payload-rest'
import type { User } from '@/payload-types'

export async function getTestPayload(): Promise<Payload> {
  return getPayload({ config })
}

/** Truncates every application table in the test database. */
export async function resetDatabase(payload: Payload) {
  const pool = (payload.db as unknown as { pool: { query: (sql: string) => Promise<{ rows: Array<{ tablename: string }> }> } }).pool
  const { rows } = await pool.query(
    `select tablename from pg_tables where schemaname = 'public' and tablename <> 'payload_migrations'`,
  )
  if (rows.length) {
    await pool.query(`TRUNCATE ${rows.map((row) => `"${row.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`)
  }
}

export const ADMIN = { email: 'admin@example.test', password: 'correct-horse-battery-staple' }

export async function createAdmin(payload: Payload): Promise<{ user: User; token: string }> {
  const user = await payload.create({ collection: 'users', data: { ...ADMIN, role: 'admin' }, overrideAccess: true })
  const { token } = await payload.login({ collection: 'users', data: ADMIN })
  return { user: user as User, token: token! }
}

// --- Lexical fixtures -----------------------------------------------------

const textNode = (text: string) => ({ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })

export function richText(...paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [textNode(text)],
      })),
    },
  }
}

export function richTextWithUpload(mediaId: number) {
  const value = richText('Diagram below.')
  value.root.children.push({ type: 'upload', version: 3, format: '', relationTo: 'media', value: mediaId, fields: {} } as never)
  return value
}

export function completeProject(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Workflow Builder',
    slug: 'workflow-builder',
    summary: 'A canvas for composing AI workflows.',
    category: 'ai-workflows' as const,
    projectType: 'professional' as const,
    role: 'Software Engineer',
    context: richText('Context paragraph.'),
    contribution: richText('Contribution paragraph.'),
    decisions: richText('Decision paragraph.'),
    outcome: richText('Outcome paragraph.'),
    contentReady: true,
    sortOrder: 100,
    ...overrides,
  }
}

export async function publishProject(payload: Payload, overrides: Record<string, unknown> = {}) {
  return payload.create({
    collection: 'projects',
    data: { ...completeProject(overrides), _status: 'published' } as never,
    overrideAccess: true,
  })
}

// --- REST through the real Payload route handlers ---------------------------

const handlers = {
  GET: REST_GET(config),
  POST: withDraftRestore(REST_POST(config)),
  PATCH: REST_PATCH(config),
  DELETE: REST_DELETE(config),
}

export async function rest(
  method: keyof typeof handlers,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<{ status: number; text: string; json: unknown }> {
  const url = new URL(path, 'http://localhost:3000')
  const slug = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean)
  const headers: Record<string, string> = {}
  if (options.token) headers.Authorization = `JWT ${options.token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const request = new Request(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  const response = await handlers[method](request, { params: Promise.resolve({ slug }) })
  const text = await response.text()
  let json: unknown = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { status: response.status, text, json }
}

// --- File fixtures ----------------------------------------------------------

export const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

export const MINIMAL_PDF = Buffer.from(
  [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj',
    'xref',
    '0 4',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    'trailer << /Size 4 /Root 1 0 R >>',
    'startxref',
    '188',
    '%%EOF',
  ].join('\n'),
)

export function fileUpload(name: string, mimetype: string, data: Buffer) {
  return { name, mimetype, size: data.length, data }
}

export async function createPublicImage(payload: Payload, overrides: Record<string, unknown> = {}) {
  return payload.create({
    collection: 'media',
    data: { alt: 'A single dot', visibility: 'public', contentReady: true, ...overrides } as never,
    file: fileUpload('dot.png', 'image/png', PNG_1PX),
    overrideAccess: true,
  })
}
