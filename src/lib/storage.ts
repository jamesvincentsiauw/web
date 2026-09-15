import { GetObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'
import { BlobNotFoundError, get } from '@vercel/blob'

/**
 * Storage backend. Chosen explicitly so a Blob token pulled into .env.local never redirects local
 * development to the production store. Local dev and tests use S3 (MinIO); Vercel sets
 * STORAGE_DRIVER=vercel-blob with a private Blob store.
 */
export type StorageDriver = 's3' | 'vercel-blob'

export function getStorageDriver(): StorageDriver {
  return process.env.STORAGE_DRIVER === 'vercel-blob' ? 'vercel-blob' : 's3'
}

export function getS3Settings(): { bucket: string; config: S3ClientConfig } {
  return {
    bucket: process.env.S3_BUCKET || '',
    config: {
      endpoint: process.env.S3_ENDPOINT || undefined,
      region: process.env.S3_REGION || 'us-east-1',
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    },
  }
}

let client: S3Client | undefined

function getClient(): S3Client {
  client ??= new S3Client(getS3Settings().config)
  return client
}

export function objectKey(doc: { filename?: string | null; prefix?: string | null }): string | null {
  if (!doc.filename) return null
  return doc.prefix ? `${doc.prefix.replace(/\/+$/, '')}/${doc.filename}` : doc.filename
}

export type StoredFile = { body: ReadableStream<Uint8Array>; contentLength?: number; contentType?: string }

/** Reads a stored object from the active backend, or null when it does not exist. */
export async function readStoredFile(key: string): Promise<StoredFile | null> {
  if (getStorageDriver() === 'vercel-blob') {
    try {
      const result = await get(key, { access: 'private', token: process.env.BLOB_READ_WRITE_TOKEN })
      if (!result || result.statusCode !== 200) return null
      return { body: result.stream, contentLength: result.blob.size, contentType: result.blob.contentType }
    } catch (error) {
      if (error instanceof BlobNotFoundError) return null
      throw error
    }
  }

  try {
    const object = await getClient().send(new GetObjectCommand({ Bucket: getS3Settings().bucket, Key: key }))
    if (!object.Body) return null
    return { body: object.Body.transformToWebStream(), contentLength: object.ContentLength, contentType: object.ContentType }
  } catch (error) {
    const name = (error as { name?: string }).name
    if (name === 'NoSuchKey' || name === 'NotFound') return null
    throw error
  }
}
