import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Education } from './collections/Education'
import { Experiences } from './collections/Experiences'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { Redirects } from './collections/Redirects'
import { Skills } from './collections/Skills'
import { Users } from './collections/Users'
import { Profile } from './globals/Profile'
import { SiteSettings } from './globals/SiteSettings'
import { getServerURL } from './lib/env'
import { limitedEditor } from './lib/richtext/editor'
import { privateVercelBlobAdapter } from './lib/private-blob-adapter'
import { getS3Settings, getStorageDriver } from './lib/storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = getServerURL()
const s3 = getS3Settings()

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Portfolio CMS',
      robots: 'noindex, nofollow',
    },
  },
  collections: [Projects, Experiences, Skills, Education, Media, Users, Redirects],
  globals: [Profile, SiteSettings],
  editor: limitedEditor,
  secret: process.env.PAYLOAD_SECRET || '',
  // Cookie-authenticated mutations are only accepted from the canonical origin.
  csrf: [serverURL],
  cors: [serverURL],
  graphQL: { disable: true },
  upload: {
    limits: { fileSize: 10 * 1024 * 1024 },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, '../migrations'),
    push: process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_DISABLE_PUSH !== 'true',
  }),
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM_ADDRESS || '',
        defaultFromName: process.env.SMTP_FROM_NAME || 'Portfolio',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  sharp,
  telemetry: false,
  plugins: [
    getStorageDriver() === 'vercel-blob'
      ? cloudStoragePlugin({
          collections: {
            media: {
              adapter: privateVercelBlobAdapter({ token: process.env.BLOB_READ_WRITE_TOKEN || '' }),
              disableLocalStorage: true,
            },
          },
        })
      : s3Storage({
          collections: { media: true },
          bucket: s3.bucket,
          config: s3.config,
        }),
  ],
})
