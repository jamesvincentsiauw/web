import 'dotenv/config'

// Integration tests never touch development content: separate database and bucket.
const devDatabase = process.env.DATABASE_URL ?? ''
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || devDatabase.replace(/\/[^/?]+(\?.*)?$/, '/portfolio_test$1')
process.env.S3_BUCKET = process.env.TEST_S3_BUCKET || 'portfolio-media-test'
process.env.SERVER_URL = 'http://localhost:3000'
process.env.SMTP_HOST = ''

if (!process.env.DATABASE_URL.includes('test')) {
  throw new Error(`Refusing to run integration tests against a non-test database: ${process.env.DATABASE_URL}`)
}
